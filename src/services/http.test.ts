import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

const config = vi.hoisted(() => ({
  apiUrl: "https://api.example.com/v1",
  authStrategy: "bearer",
  requestTimeoutMs: 100,
}));
vi.mock("@/config/env", () => ({ env: config }));
import { ApiError, api, request } from "./http";
import { tokenStorage } from "./token-storage";

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  config.apiUrl = "https://api.example.com/v1";
  config.authStrategy = "bearer";
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  tokenStorage.set("secret-token");
});
afterEach(() => {
  tokenStorage.clear();
  vi.useRealTimers();
});

function lastRequest(): RequestInit {
  const options = fetchMock.mock.calls.at(-1)?.[1];
  if (!options) throw new Error("Expected fetch options");
  return options;
}

describe("HTTP API scope and auth", () => {
  it("sends bearer auth only to the configured API, with cookies omitted and redirects blocked", async () => {
    fetchMock.mockResolvedValue(new Response('{"ok":true}'));
    expect(await api.get("/todos?limit=10")).toEqual({ ok: true });
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://api.example.com/v1/todos?limit=10");
    expect(new Headers(lastRequest().headers).get("Authorization")).toBe("Bearer secret-token");
    expect(lastRequest()).toMatchObject({ credentials: "omit", redirect: "error" });
  });
  it.each([
    "https://evil.example/todos",
    "//evil.example/todos",
    "../admin",
    "https://api.example.com/v10/todos",
    "https://user:pass@api.example.com/v1/todos",
    "/todos#secret",
    "https://api.example.com/admin",
    "https://api.example.com/v1/../admin",
  ])("blocks unsafe destination %s before fetch", async (path) => {
    await expect(request(path, { auth: false })).rejects.toThrow("configured API base");
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("supports same-origin relative APIs", async () => {
    config.apiUrl = "/api";
    vi.stubGlobal("location", { origin: "https://app.example.com" });
    fetchMock.mockResolvedValue(new Response("{}"));
    await api.get("/todos");
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://app.example.com/api/todos");
  });
  it("allows absolute URLs within the configured scope", async () => {
    fetchMock.mockResolvedValue(new Response("{}"));
    await request("https://api.example.com/v1/todos");
    expect(fetchMock).toHaveBeenCalledOnce();
  });
  it("auth:false strips caller Authorization headers", async () => {
    fetchMock.mockResolvedValue(new Response("{}"));
    await request("/auth/login", { auth: false, headers: { Authorization: "Bearer accidental" } });
    expect(new Headers(lastRequest().headers).has("Authorization")).toBe(false);
  });
  it("cookie auth includes cookies, not bearer tokens", async () => {
    config.authStrategy = "cookie";
    fetchMock.mockResolvedValue(new Response("{}"));
    await api.get("/todos");
    expect(lastRequest().credentials).toBe("include");
    expect(new Headers(lastRequest().headers).has("Authorization")).toBe(false);
  });
  it("preserves caller CSRF headers and includes credentials when explicitly requested", async () => {
    fetchMock.mockResolvedValue(new Response("{}"));
    await api.post("/auth/refresh", undefined, {
      credentials: "include",
      headers: { "X-CSRF-Token": "csrf" },
    });
    expect(lastRequest().credentials).toBe("include");
    expect(new Headers(lastRequest().headers).get("X-CSRF-Token")).toBe("csrf");
  });
});

describe("HTTP bodies and errors", () => {
  it("rejects circular JSON before allocating timers or sending requests", async () => {
    vi.useFakeTimers();
    const body: { self?: unknown } = {};
    body.self = body;
    await expect(api.post("/todos", body)).rejects.toBeInstanceOf(TypeError);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("serializes JSON and applies the requested method", async () => {
    fetchMock.mockResolvedValue(new Response('{"id":1}'));
    await api.patch("/todos/1", { completed: true });
    expect(lastRequest()).toMatchObject({ method: "PATCH", body: '{"completed":true}' });
    expect(new Headers(lastRequest().headers).get("Content-Type")).toBe("application/json");
  });
  it("leaves FormData boundaries to fetch", async () => {
    const body = new FormData();
    body.append("name", "test");
    fetchMock.mockResolvedValue(new Response("{}"));
    await api.post("/files", body);
    expect(lastRequest().body).toBe(body);
    expect(new Headers(lastRequest().headers).has("Content-Type")).toBe(false);
  });
  it.each([204, 205])("handles %i no-content responses", async (status) => {
    fetchMock.mockResolvedValue(new Response(null, { status }));
    expect(await api.delete("/todos/1")).toBeUndefined();
  });
  it("handles empty and opt-in text responses", async () => {
    fetchMock.mockResolvedValueOnce(new Response("")).mockResolvedValueOnce(new Response("hello"));
    expect(await api.get("/empty")).toBeUndefined();
    expect(await api.get("/text", { responseType: "text" })).toBe("hello");
  });
  it("throws typed API errors with server messages", async () => {
    fetchMock.mockResolvedValue(
      new Response('{"message":"Not allowed","code":"forbidden"}', { status: 403 }),
    );
    await expect(api.get("/todos")).rejects.toMatchObject({
      name: "ApiError",
      status: 403,
      message: "Not allowed",
      payload: { code: "forbidden" },
    });
  });
  it("uses a safe fallback for malformed API error messages", async () => {
    fetchMock.mockResolvedValue(new Response('{"message":42}', { status: 400 }));
    await expect(api.get("/todos")).rejects.toMatchObject({
      message: "Request failed with status 400",
    });
  });
  it("normalizes non-JSON error responses", async () => {
    fetchMock.mockResolvedValue(new Response("<html>Bad gateway</html>", { status: 502 }));
    await expect(api.get("/todos")).rejects.toEqual(new ApiError(502, null));
  });
  it("rejects invalid JSON success responses rather than claiming success", async () => {
    fetchMock.mockResolvedValue(new Response("not json"));
    await expect(api.get("/todos")).rejects.toBeInstanceOf(SyntaxError);
  });
  it("implements put and delete methods", async () => {
    fetchMock.mockImplementation(async () => new Response(null, { status: 204 }));
    await api.put("/todos/1", { title: "changed" });
    expect(lastRequest().method).toBe("PUT");
    await api.delete("/todos/1");
    expect(lastRequest().method).toBe("DELETE");
  });
});

describe("request cancellation", () => {
  function hangingFetch() {
    fetchMock.mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          const signal = init?.signal;
          if (signal?.aborted) reject(signal.reason);
          else signal?.addEventListener("abort", () => reject(signal.reason), { once: true });
        }),
    );
  }
  it("times out even when a caller supplies an AbortSignal", async () => {
    vi.useFakeTimers();
    hangingFetch();
    const caller = new AbortController();
    const result = expect(api.get("/todos", { signal: caller.signal })).rejects.toMatchObject({
      name: "TimeoutError",
    });
    await vi.advanceTimersByTimeAsync(100);
    await result;
    expect(caller.signal.aborted).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("propagates caller cancellation and removes timers", async () => {
    vi.useFakeTimers();
    hangingFetch();
    const caller = new AbortController();
    const result = expect(api.get("/todos", { signal: caller.signal })).rejects.toMatchObject({
      name: "AbortError",
    });
    caller.abort();
    await result;
    expect(vi.getTimerCount()).toBe(0);
  });
  it("honors already-aborted signals", async () => {
    hangingFetch();
    const caller = new AbortController();
    caller.abort();
    await expect(api.get("/todos", { signal: caller.signal })).rejects.toMatchObject({
      name: "AbortError",
    });
  });
  it("keeps timeout active until the response body has been read", async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(async (_url, init) => {
      const response = new Response("{}");
      vi.spyOn(response, "text").mockImplementation(
        () =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => reject(init.signal?.reason), {
              once: true,
            });
          }),
      );
      return response;
    });
    const result = expect(api.get("/todos")).rejects.toMatchObject({ name: "TimeoutError" });
    await vi.advanceTimersByTimeAsync(100);
    await result;
    expect(vi.getTimerCount()).toBe(0);
  });
  it("cleans timers and abort listeners after successful and failed requests", async () => {
    vi.useFakeTimers();
    const caller = new AbortController();
    const removeListener = vi.spyOn(caller.signal, "removeEventListener");
    fetchMock
      .mockResolvedValueOnce(new Response("{}"))
      .mockRejectedValueOnce(new TypeError("Network error"));
    await api.get("/todos", { signal: caller.signal });
    expect(removeListener).toHaveBeenCalledWith("abort", expect.any(Function));
    await expect(api.get("/todos")).rejects.toThrow("Network error");
    expect(vi.getTimerCount()).toBe(0);
  });
});

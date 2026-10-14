import { env } from "@/config/env";
import { tokenStorage } from "@/services/token-storage";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiErrorPayload {
  message?: string;
  code?: string;
  errors?: Record<string, string[]>;
}

export class ApiError extends Error {
  readonly status: number;
  readonly payload: ApiErrorPayload | null;

  constructor(status: number, payload: ApiErrorPayload | null) {
    super(
      typeof payload?.message === "string"
        ? payload.message
        : `Request failed with status ${status}`,
    );
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export interface RequestOptions extends Omit<RequestInit, "body" | "method" | "redirect"> {
  body?: unknown;
  method?: HttpMethod;
  auth?: boolean;
  responseType?: "json" | "text";
}

function buildUrl(path: string): string {
  const base = new URL(`${env.apiUrl}/`, globalThis.location?.origin ?? "http://localhost");
  const url = /^https?:\/\//i.test(path) ? new URL(path) : new URL(path.replace(/^\/+/, ""), base);

  // Fail closed: no protocol-relative URLs, traversal, credentials or requests
  // outside the configured API scope, even with auth:false (cookies may be sent).
  if (
    path.startsWith("//") ||
    url.origin !== base.origin ||
    !url.pathname.startsWith(base.pathname) ||
    url.username ||
    url.password ||
    url.hash
  ) {
    throw new Error("Request URL must remain inside the configured API base");
  }
  return url.href;
}

async function parseResponse<T>(response: Response, responseType: "json" | "text"): Promise<T> {
  if (response.status === 204 || response.status === 205) return undefined as T;
  const text = await response.text();
  if (!text) return undefined as T;
  return (responseType === "text" ? text : JSON.parse(text)) as T;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = buildUrl(path);
  const {
    auth = true,
    body,
    headers: optionHeaders,
    method = "GET",
    signal,
    responseType = "json",
    credentials = env.authStrategy === "cookie" ? "include" : "omit",
    ...init
  } = options;
  const headers = new Headers(optionHeaders);

  if (body !== undefined && !(body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (!headers.has("Accept"))
    headers.set("Accept", responseType === "json" ? "application/json" : "text/plain");
  // Auth is controlled here, never by accidentally inherited caller headers.
  headers.delete("Authorization");
  if (auth && env.authStrategy === "bearer") {
    const token = tokenStorage.get();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  // Serialize before registering timers/listeners: circular bodies can throw.
  const serializedBody =
    body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body);
  const controller = new AbortController();
  const abort = () => controller.abort(signal?.reason);
  signal?.addEventListener("abort", abort, { once: true });
  if (signal?.aborted) abort();
  const timeoutId = globalThis.setTimeout(
    () => controller.abort(new DOMException("Request timed out", "TimeoutError")),
    env.requestTimeoutMs,
  );
  const requestInit: RequestInit = {
    ...init,
    method,
    headers,
    credentials,
    redirect: "error",
    signal: controller.signal,
  };
  if (serializedBody !== undefined) requestInit.body = serializedBody;

  try {
    const response = await fetch(url, requestInit);
    if (!response.ok) {
      const data: unknown = await parseResponse<unknown>(response, "json").catch(
        (error: unknown) => {
          if (controller.signal.aborted) throw error;
          return null;
        },
      );
      const payload =
        data && typeof data === "object" && !Array.isArray(data) ? (data as ApiErrorPayload) : null;
      throw new ApiError(response.status, payload);
    }
    // Await parsing so the timeout covers response body consumption as well.
    return await parseResponse<T>(response, responseType);
  } finally {
    globalThis.clearTimeout(timeoutId);
    signal?.removeEventListener("abort", abort);
  }
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),
};

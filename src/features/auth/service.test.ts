import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

const config = vi.hoisted(() => ({ authStrategy: "bearer" }));
vi.mock("@/config/env", () => ({ env: config }));
vi.mock("@/services/http", () => ({ api: { get: vi.fn(), post: vi.fn() } }));
import { api } from "@/services/http";
import { tokenStorage } from "@/services/token-storage";
import { authService } from "./service";

const user = { id: "1", name: "Test", email: "test@example.com" };
const credentials = { email: user.email, password: "password" };

beforeEach(() => {
  config.authStrategy = "bearer";
  vi.mocked(api.get).mockReset();
  vi.mocked(api.post).mockReset();
  tokenStorage.clear();
});

describe("auth service", () => {
  it("stores bearer login tokens only in memory", async () => {
    const storage = { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() };
    vi.stubGlobal("localStorage", storage);
    vi.mocked(api.post).mockResolvedValue({ user, accessToken: "new-token" });
    await authService.login(credentials);
    expect(tokenStorage.get()).toBe("new-token");
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(api.post).toHaveBeenCalledWith("/auth/login", credentials, {
      auth: false,
      credentials: "include",
    });
  });
  it("supports cookie login responses without access tokens", async () => {
    config.authStrategy = "cookie";
    tokenStorage.set("old-token");
    vi.mocked(api.post).mockResolvedValue({ user });
    expect(await authService.login(credentials)).toEqual({ user });
    expect(tokenStorage.get()).toBeNull();
  });
  it("rejects missing bearer tokens and clears prior credentials", async () => {
    tokenStorage.set("old-token");
    vi.mocked(api.post).mockResolvedValue({ user });
    await expect(authService.login(credentials)).rejects.toThrow("requires an access token");
    expect(tokenStorage.get()).toBeNull();
  });
  it("updates the access token after refresh", async () => {
    tokenStorage.set("old-token");
    vi.mocked(api.post).mockResolvedValue({ user, accessToken: "refreshed-token" });
    await authService.refresh();
    expect(tokenStorage.get()).toBe("refreshed-token");
    expect(api.post).toHaveBeenCalledWith("/auth/refresh", undefined, {
      auth: false,
      credentials: "include",
    });
  });
  it("clears stale tokens after failed refresh", async () => {
    tokenStorage.set("old-token");
    vi.mocked(api.post).mockRejectedValue(new Error("Expired"));
    await expect(authService.refresh()).rejects.toThrow("Expired");
    expect(tokenStorage.get()).toBeNull();
  });
  it("clears tokens even when server logout fails, without hiding the failure", async () => {
    tokenStorage.set("old-token");
    vi.mocked(api.post).mockRejectedValue(new Error("Server unavailable"));
    await expect(authService.logout()).rejects.toThrow("Server unavailable");
    expect(tokenStorage.get()).toBeNull();
  });
  it("clears tokens on successful logout", async () => {
    tokenStorage.set("old-token");
    vi.mocked(api.post).mockResolvedValue(undefined);
    await authService.logout();
    expect(tokenStorage.get()).toBeNull();
  });
  it("clears tokens when /me rejects an invalid session", async () => {
    tokenStorage.set("old-token");
    vi.mocked(api.get).mockRejectedValue(Object.assign(new Error("Unauthorized"), { status: 401 }));
    await expect(authService.me()).rejects.toThrow("Unauthorized");
    expect(tokenStorage.get()).toBeNull();
  });
  it("does not destroy tokens on transient network errors", async () => {
    tokenStorage.set("old-token");
    vi.mocked(api.get).mockRejectedValue(new TypeError("Network error"));
    await expect(authService.me()).rejects.toThrow("Network error");
    expect(tokenStorage.get()).toBe("old-token");
  });
  it("returns the current user", async () => {
    vi.mocked(api.get).mockResolvedValue(user);
    expect(await authService.me()).toEqual(user);
  });
  it("rejects empty tokens", () => {
    expect(() => tokenStorage.set("  ")).toThrow("must not be empty");
  });
});

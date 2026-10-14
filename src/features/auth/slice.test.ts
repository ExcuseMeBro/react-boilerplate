import { configureStore } from "@reduxjs/toolkit";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
vi.mock("./service", () => ({
  authService: { login: vi.fn(), me: vi.fn(), refresh: vi.fn(), logout: vi.fn() },
}));
import { authService } from "./service";
import reducer, { loadCurrentUser, login, logout, refreshSession } from "./slice";

const user = { id: "1", name: "Test", email: "test@example.com" };
const credentials = { email: user.email, password: "secret" };
const makeStore = () => configureStore({ reducer: { auth: reducer }, devTools: false });
beforeEach(() => vi.resetAllMocks());

describe("auth state", () => {
  it("does not put bearer tokens in Redux state or fulfilled actions", async () => {
    vi.mocked(authService.login).mockResolvedValue({ user, accessToken: "sensitive-token" });
    const store = makeStore();
    const action = await store.dispatch(login(credentials));
    expect(action.payload).toEqual(user);
    expect(store.getState().auth).toEqual({ user, status: "authenticated", error: null });
    expect(JSON.stringify(store.getState())).not.toContain("sensitive-token");
  });
  it("clears old user state when login fails", async () => {
    const store = makeStore();
    vi.mocked(authService.login)
      .mockResolvedValueOnce({ user })
      .mockRejectedValueOnce(new Error("Invalid credentials"));
    await store.dispatch(login(credentials));
    await store.dispatch(login(credentials));
    expect(store.getState().auth).toEqual({
      user: null,
      status: "anonymous",
      error: "Invalid credentials",
    });
  });
  it("restores and refreshes users without storing tokens", async () => {
    const store = makeStore();
    vi.mocked(authService.me).mockResolvedValue(user);
    vi.mocked(authService.refresh).mockResolvedValue({ user, accessToken: "sensitive-token" });
    await store.dispatch(loadCurrentUser());
    const action = await store.dispatch(refreshSession());
    expect(action.payload).toEqual(user);
    expect(store.getState().auth.user).toEqual(user);
  });
  it("clears local state even when server logout fails", async () => {
    const store = makeStore();
    vi.mocked(authService.me).mockResolvedValue(user);
    await store.dispatch(loadCurrentUser());
    vi.mocked(authService.logout).mockRejectedValue(new Error("Unavailable"));
    await store.dispatch(logout());
    expect(store.getState().auth).toEqual({
      user: null,
      status: "anonymous",
      error: "Unavailable",
    });
  });
  it("resets local state after successful logout", async () => {
    const store = makeStore();
    vi.mocked(authService.me).mockResolvedValue(user);
    await store.dispatch(loadCurrentUser());
    vi.mocked(authService.logout).mockResolvedValue(undefined);
    await store.dispatch(logout());
    expect(store.getState().auth).toEqual({ user: null, status: "anonymous", error: null });
  });
  it("marks failed session checks and refreshes anonymous", async () => {
    const store = makeStore();
    vi.mocked(authService.me).mockRejectedValue(new Error("Unauthorized"));
    vi.mocked(authService.refresh).mockRejectedValue(new Error("Expired"));
    await store.dispatch(loadCurrentUser());
    expect(store.getState().auth.error).toBe("Unauthorized");
    await store.dispatch(refreshSession());
    expect(store.getState().auth).toEqual({ user: null, status: "anonymous", error: "Expired" });
  });
});

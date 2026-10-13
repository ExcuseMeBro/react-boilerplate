import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { authService } from "./service";
import type { AuthUser, LoginRequest } from "./types";

interface AuthState {
  user: AuthUser | null;
  status: "idle" | "loading" | "authenticated" | "anonymous";
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  status: "idle",
  error: null,
};

// Keep access tokens out of Redux state and fulfilled action payloads.
export const login = createAsyncThunk("auth/login", async (payload: LoginRequest) => {
  return (await authService.login(payload)).user;
});

export const loadCurrentUser = createAsyncThunk("auth/me", async () => authService.me());
export const refreshSession = createAsyncThunk("auth/refresh", async () => {
  return (await authService.refresh()).user;
});
export const logout = createAsyncThunk("auth/logout", async () => authService.logout());

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.user = null;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = "authenticated";
        state.user = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "anonymous";
        state.user = null;
        state.error = action.error.message ?? "Login failed";
      })
      .addCase(loadCurrentUser.fulfilled, (state, action) => {
        state.status = "authenticated";
        state.user = action.payload;
        state.error = null;
      })
      .addCase(loadCurrentUser.rejected, (state, action) => {
        state.status = "anonymous";
        state.user = null;
        state.error = action.error.message ?? "Session check failed";
      })
      .addCase(refreshSession.fulfilled, (state, action) => {
        state.status = "authenticated";
        state.user = action.payload;
        state.error = null;
      })
      .addCase(refreshSession.rejected, (state, action) => {
        state.status = "anonymous";
        state.user = null;
        state.error = action.error.message ?? "Session refresh failed";
      })
      .addCase(logout.fulfilled, () => ({ ...initialState, status: "anonymous" }))
      .addCase(logout.rejected, (_state, action) => ({
        ...initialState,
        status: "anonymous",
        error: action.error.message ?? "Server logout failed",
      }));
  },
});

export default authSlice.reducer;

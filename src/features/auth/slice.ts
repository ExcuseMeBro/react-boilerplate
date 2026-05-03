import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { tokenStorage } from '@/services/token-storage';
import { authService } from './service';
import type { AuthUser, LoginRequest } from './types';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  status: 'idle' | 'loading' | 'authenticated' | 'anonymous';
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: tokenStorage.get(),
  status: tokenStorage.get() ? 'authenticated' : 'anonymous',
  error: null,
};

export const login = createAsyncThunk('auth/login', async (payload: LoginRequest) => {
  return authService.login(payload);
});

export const loadCurrentUser = createAsyncThunk('auth/me', async () => {
  return authService.me();
});

export const logout = createAsyncThunk('auth/logout', async () => {
  await authService.logout();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'authenticated';
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'anonymous';
        state.error = action.error.message ?? 'Login failed';
      })
      .addCase(loadCurrentUser.fulfilled, (state, action) => {
        state.status = 'authenticated';
        state.user = action.payload;
      })
      .addCase(loadCurrentUser.rejected, (state) => {
        state.status = 'anonymous';
        state.user = null;
        state.accessToken = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.status = 'anonymous';
        state.user = null;
        state.accessToken = null;
        state.error = null;
      });
  },
});

export default authSlice.reducer;

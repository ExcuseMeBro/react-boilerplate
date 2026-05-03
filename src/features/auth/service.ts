import { api } from '@/services/http';
import { tokenStorage } from '@/services/token-storage';
import type { AuthUser, LoginRequest, LoginResponse } from './types';

export const authService = {
  async login(payload: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', payload, { auth: false });
    tokenStorage.set(response.accessToken);
    return response;
  },
  me(): Promise<AuthUser> {
    return api.get<AuthUser>('/auth/me');
  },
  async logout(): Promise<void> {
    await api.post<void>('/auth/logout').catch(() => undefined);
    tokenStorage.clear();
  },
  refresh(): Promise<LoginResponse> {
    return api.post<LoginResponse>('/auth/refresh', undefined, { auth: false });
  },
};

import { env } from "@/config/env";
import { api } from "@/services/http";
import { tokenStorage } from "@/services/token-storage";
import type { AuthUser, LoginRequest, LoginResponse } from "./types";

function acceptSession(response: LoginResponse): LoginResponse {
  if (env.authStrategy === "bearer") {
    if (!response.accessToken) throw new Error("Bearer authentication requires an access token");
    tokenStorage.set(response.accessToken);
  } else {
    tokenStorage.clear();
  }
  return response;
}

export const authService = {
  async login(this: void, payload: LoginRequest): Promise<LoginResponse> {
    tokenStorage.clear();
    const response = await api.post<LoginResponse>("/auth/login", payload, {
      auth: false,
      credentials: "include",
    });
    return acceptSession(response);
  },
  async me(this: void): Promise<AuthUser> {
    try {
      return await api.get<AuthUser>("/auth/me");
    } catch (error) {
      // A network/5xx failure is not proof that the session is invalid.
      if (error instanceof Error && "status" in error && error.status === 401) tokenStorage.clear();
      throw error;
    }
  },
  async logout(this: void): Promise<void> {
    try {
      await api.post<void>("/auth/logout", undefined, { credentials: "include" });
    } finally {
      tokenStorage.clear();
    }
  },
  async refresh(this: void): Promise<LoginResponse> {
    try {
      const response = await api.post<LoginResponse>("/auth/refresh", undefined, {
        auth: false,
        credentials: "include",
      });
      return acceptSession(response);
    } catch (error) {
      tokenStorage.clear();
      throw error;
    }
  },
};

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  roles?: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

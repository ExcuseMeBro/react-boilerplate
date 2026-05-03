import { env } from '@/config/env';
import { tokenStorage } from '@/services/token-storage';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiErrorPayload {
  message?: string;
  code?: string;
  errors?: Record<string, string[]>;
}

export class ApiError extends Error {
  readonly status: number;
  readonly payload: ApiErrorPayload | null;

  constructor(status: number, payload: ApiErrorPayload | null) {
    super(payload?.message ?? `Request failed with status ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

interface RequestOptions extends Omit<RequestInit, 'body' | 'method'> {
  body?: unknown;
  method?: HttpMethod;
  auth?: boolean;
}

function buildUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${env.apiUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

async function parseJson<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();

  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true, body, headers: optionHeaders, method = 'GET', signal, ...init } = options;
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), env.requestTimeoutMs);
  const headers = new Headers(optionHeaders);

  if (body !== undefined && !(body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (auth && env.authStrategy === 'bearer') {
    const token = tokenStorage.get();

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const requestInit: RequestInit = {
    ...init,
    method,
    headers,
    credentials: 'include',
    signal: signal ?? controller.signal,
  };

  if (body !== undefined) {
    requestInit.body = body instanceof FormData ? body : JSON.stringify(body);
  }

  try {
    const response = await fetch(buildUrl(path), requestInit);

    if (!response.ok) {
      const payload = await parseJson<ApiErrorPayload>(response).catch(() => null);
      throw new ApiError(response.status, payload);
    }

    return parseJson<T>(response);
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};

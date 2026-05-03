const DEFAULT_API_URL = 'http://localhost:8080/api';
const DEFAULT_TIMEOUT_MS = 15_000;

export type AuthStrategy = 'bearer' | 'cookie';

const authStrategy = import.meta.env.VITE_AUTH_STRATEGY === 'cookie' ? 'cookie' : 'bearer';

export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? DEFAULT_API_URL,
  authStrategy: authStrategy satisfies AuthStrategy,
  requestTimeoutMs: Number(import.meta.env.VITE_REQUEST_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS),
} as const;

const DEFAULT_API_URL = "/api";
const DEFAULT_TIMEOUT_MS = 15_000;

export type AuthStrategy = "bearer" | "cookie";

interface EnvInput {
  VITE_API_URL?: string;
  VITE_AUTH_STRATEGY?: string;
  VITE_REQUEST_TIMEOUT_MS?: string;
  PROD?: boolean;
}

// Exported separately so configuration can be validated without starting the app.
export function parseEnv(input: EnvInput) {
  const apiUrl = input.VITE_API_URL?.trim() || DEFAULT_API_URL;
  const relative = apiUrl.startsWith("/") && !apiUrl.startsWith("//");
  const url = new URL(apiUrl, relative ? "http://localhost" : undefined);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error("VITE_API_URL must be an HTTP(S) URL without credentials, query or fragment");
  }
  if (input.PROD && !relative && url.protocol !== "https:") {
    throw new Error("VITE_API_URL must use HTTPS in production");
  }

  const authStrategy = input.VITE_AUTH_STRATEGY ?? "cookie";
  if (authStrategy !== "cookie" && authStrategy !== "bearer") {
    throw new Error("VITE_AUTH_STRATEGY must be cookie or bearer");
  }

  const requestTimeoutMs = Number(input.VITE_REQUEST_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);
  if (
    !Number.isSafeInteger(requestTimeoutMs) ||
    requestTimeoutMs <= 0 ||
    requestTimeoutMs > 2_147_483_647
  ) {
    throw new Error("VITE_REQUEST_TIMEOUT_MS must be a positive timer-safe integer");
  }

  return {
    apiUrl: (relative ? url.pathname : url.href).replace(/\/$/, ""),
    authStrategy: authStrategy satisfies AuthStrategy,
    requestTimeoutMs,
  } as const;
}

export const env = parseEnv(import.meta.env);

// Access tokens intentionally never persist to localStorage/sessionStorage.
// Use an HttpOnly refresh cookie (or cookie auth) to restore sessions after reload.
let memoryToken: string | null = null;

export const tokenStorage = {
  get(): string | null {
    return memoryToken;
  },
  set(token: string): void {
    if (!token.trim()) throw new Error("Access token must not be empty");
    memoryToken = token;
  },
  clear(): void {
    memoryToken = null;
  },
};

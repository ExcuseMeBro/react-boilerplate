const TOKEN_KEY = 'react_boilerplate.access_token';

let memoryToken: string | null = null;

export const tokenStorage = {
  get(): string | null {
    if (memoryToken) {
      return memoryToken;
    }

    return window.localStorage.getItem(TOKEN_KEY);
  },
  set(token: string): void {
    memoryToken = token;
    window.localStorage.setItem(TOKEN_KEY, token);
  },
  clear(): void {
    memoryToken = null;
    window.localStorage.removeItem(TOKEN_KEY);
  },
};

let accessTokenMemory: string | null = null;
const REFRESH_TOKEN_KEY = "nadakki_refresh_token_v2";

export const tokenStorage = {
  setTokens: ({ accessToken, refreshToken }: { accessToken: string; refreshToken: string }): void => {
    accessTokenMemory = accessToken;
    if (typeof window !== "undefined") {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  },
  getAccessToken: (): string | null => accessTokenMemory,
  getRefreshToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  clearTokens: (): void => {
    accessTokenMemory = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  },
  isAuthenticated: (): boolean => accessTokenMemory !== null,
};

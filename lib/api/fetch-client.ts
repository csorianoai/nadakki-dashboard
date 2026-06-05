"use client";

import { tokenStorage } from "@/lib/auth/token-storage";
import { refreshAccessToken, isTokenExpiringSoon } from "@/lib/auth/token-refresh";

export type ApiFetchInit = RequestInit & {
  /** Skip Bearer injection (e.g. legacy `/api/v1/auth/login` before tokens exist). */
  skipAuthHeaders?: boolean;
  /** Skip retry-on-401 logic (used internally to prevent recursion). */
  _isRetry?: boolean;
};

/**
 * Prefix relative paths with public API base (same fallback chain as Credit Hub client).
 * Absolute http(s) URLs are unchanged.
 */
export function resolveApiUrl(path: string): string {
  const trimmedPath = path.trim();
  if (/^https?:\/\//i.test(trimmedPath)) return trimmedPath;

  const raw =
    process.env.NEXT_PUBLIC_NADAKKI_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "";

  const trimmedBase = raw.trim().replace(/\/+$/, "");
  const normalizedPath = trimmedPath.startsWith("/") ? trimmedPath : `/${trimmedPath}`;
  if (!trimmedBase) return normalizedPath;
  return `${trimmedBase}${normalizedPath}`;
}

/** Auth V2 in-memory token first; legacy `nadakki_sic_token` fallback. */
export function getAuthHeaders(): Record<string, string> {
  const v2Token = tokenStorage.getAccessToken();
  if (v2Token) return { Authorization: `Bearer ${v2Token}` };

  if (typeof window !== "undefined") {
    const legacyToken = window.localStorage.getItem("nadakki_sic_token");
    if (legacyToken) return { Authorization: `Bearer ${legacyToken}` };
  }

  return {};
}

/**
 * Browser fetch with backend base URL + optional Bearer (unless {@link ApiFetchInit.skipAuthHeaders}).
 * Keeps caller headers; fills Authorization only when absent.
 *
 * Audit #4 P1: On 401, attempts a single token refresh + retry.
 * If the retry also fails, returns the 401 response without looping.
 */
export async function apiFetch(path: string, init: ApiFetchInit = {}): Promise<Response> {
  const { skipAuthHeaders, _isRetry, ...fetchInit } = init;

  // Layer 1 (proactive): if token is about to expire, refresh before the request
  if (!skipAuthHeaders && !_isRetry && isTokenExpiringSoon(30)) {
    await refreshAccessToken();
  }

  const url = resolveApiUrl(path);
  const headers = new Headers(fetchInit.headers ?? undefined);

  if (!skipAuthHeaders) {
    const auth = getAuthHeaders();
    if (auth.Authorization && !headers.has("Authorization")) {
      headers.set("Authorization", auth.Authorization);
    }
  }

  const body = fetchInit.body;
  if (typeof body === "string" && body.length > 0 && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...fetchInit,
    headers,
    credentials: fetchInit.credentials ?? "include",
  });

  // Layer 2 (reactive): retry once on 401 with a refreshed token
  if (response.status === 401 && !skipAuthHeaders && !_isRetry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiFetch(path, { ...init, _isRetry: true });
    }
  }

  return response;
}

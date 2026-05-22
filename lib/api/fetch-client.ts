"use client";

import { tokenStorage } from "@/lib/auth/token-storage";

export type ApiFetchInit = RequestInit & {
  /** Skip Bearer injection (e.g. legacy `/api/v1/auth/login` before tokens exist). */
  skipAuthHeaders?: boolean;
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
 */
export async function apiFetch(path: string, init: ApiFetchInit = {}): Promise<Response> {
  const { skipAuthHeaders, ...fetchInit } = init;
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

  return fetch(url, {
    ...fetchInit,
    headers,
    credentials: fetchInit.credentials ?? "include",
  });
}

/**
 * Platform-scoped API fetch — Bearer JWT only, no tenant header.
 * Use for: /observability/v1/*, /tenant-admin/v1/*, /auth-users/v1/*, /credit-hub/v1/*
 *
 * MUST NOT import tenant-scoped credit hub fetch module.
 */
import { tokenStorage } from "@/lib/auth/token-storage";

const LEGACY_TOKEN_KEY = "nadakki_sic_token";

/** Prefixes that must only be called via platformFetch (enforced in tests). */
export const PLATFORM_API_PREFIXES = [
  "/observability/v1",
  "/tenant-admin/v1",
  "/auth-users/v1",
  "/credit-hub/v1",
] as const;

export function isPlatformApiPath(path: string): boolean {
  const p = path.startsWith("/") ? path : `/${path}`;
  return PLATFORM_API_PREFIXES.some((prefix) => p.startsWith(prefix));
}

export class PlatformApiError extends Error {
  constructor(
    public status: number,
    public detail: string,
    public code?: string,
  ) {
    super(detail);
    this.name = "PlatformApiError";
  }
}

function apiBase(): string {
  if (typeof window !== "undefined") return "";
  const raw =
    process.env.NEXT_PUBLIC_NADAKKI_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "";
  return raw.trim().replace(/\/+$/, "");
}

function resolveUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const base = apiBase();
  return base ? `${base}${normalized}` : normalized;
}

function readToken(): string | null {
  return tokenStorage.getAccessToken() ?? (typeof window !== "undefined" ? localStorage.getItem(LEGACY_TOKEN_KEY) : null);
}

function redirectLogin(): void {
  if (typeof window === "undefined") return;
  if (window.location.pathname.startsWith("/login")) return;
  window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
}

function parseDetail(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object") return fallback;
  const o = body as Record<string, unknown>;
  if (typeof o.detail === "string") return o.detail;
  if (typeof o.message === "string") return o.message;
  if (o.detail && typeof o.detail === "object") {
    const d = o.detail as Record<string, unknown>;
    if (typeof d.message === "string") return d.message;
    if (typeof d.code === "string") return d.code;
  }
  return fallback;
}

function parseCode(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const o = body as Record<string, unknown>;
  if (typeof o.code === "string") return o.code;
  if (o.detail && typeof o.detail === "object") {
    const d = o.detail as Record<string, unknown>;
    if (typeof d.code === "string") return d.code;
  }
  return undefined;
}

export interface PlatformFetchInit extends Omit<RequestInit, "headers"> {
  headers?: Record<string, string>;
  timeoutMs?: number;
}

export async function platformFetch<T>(path: string, init: PlatformFetchInit = {}): Promise<T> {
  if (!isPlatformApiPath(path)) {
    throw new Error(`platformFetch: path must match platform prefixes: ${path}`);
  }

  const token = readToken();
  const method = (init.method ?? "GET").toUpperCase();
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.body ? { "Content-Type": "application/json" } : {}),
    ...(init.headers ?? {}),
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), init.timeoutMs ?? 30_000);

  try {
    const res = await fetch(resolveUrl(path), {
      ...init,
      method,
      headers,
      signal: controller.signal,
      credentials: "include",
    });

    let body: unknown = null;
    try {
      body = await res.clone().json();
    } catch {
      body = null;
    }

    if (res.status === 401) {
      redirectLogin();
      throw new PlatformApiError(401, "Sesión expirada. Inicia sesión de nuevo.");
    }

    if (!res.ok) {
      throw new PlatformApiError(
        res.status,
        parseDetail(body, `Error ${res.status}`),
        parseCode(body),
      );
    }

    return body as T;
  } finally {
    clearTimeout(timeout);
  }
}

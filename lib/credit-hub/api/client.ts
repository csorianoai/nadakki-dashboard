"use client";

import { tokenStorage } from "@/lib/auth/token-storage";

import { throwIfChFeatureDisabled } from "../utils/featureDisabled";

export class TenantRequiredError extends Error {
  constructor() {
    super("Tenant ID required");
    this.name = "TenantRequiredError";
  }
}

export class CHApiError extends Error {
  constructor(public detail: string, public status: number) {
    super(detail);
    this.name = "CHApiError";
  }
}

export class CHMutationForbiddenError extends Error {
  constructor() {
    super("Viewer role cannot perform Credit Hub mutations");
    this.name = "CHMutationForbiddenError";
  }
}

export type CHActorRole = "dealer" | "bank" | "bank_analyst" | "bank_admin" | "compliance_officer" | "customer" | "admin";

export interface CHRequestInit extends Omit<RequestInit, "headers"> {
  tenantId: string;
  actorRole: CHActorRole;
  idempotencyKey?: string;
  /** Override default 30s abort (analytics cold-start on Render). */
  timeoutMs?: number;
  headers?: Record<string, string>;
}

/** Legacy login (`contexts/AuthContext.tsx`) persists JWT under `nadakki_sic_token`. Auth v2 keeps the access token in memory (`tokenStorage.getAccessToken`). */
const LEGACY_ACCESS_TOKEN_STORAGE_KEY = "nadakki_sic_token";
const DASHBOARD_ROLE_KEY = "nadakki_role";

/** Canonical fallback chain — matches fetch-client.ts and credit-api.ts.
 *
 * CORS fix (Audit #4.1): In the browser, always return "" so chFetch
 * uses relative URLs that route through Next.js same-origin (rewrites
 * or BFF catch-all). The external base URL is only used server-side.
 */
function getCreditHubApiBaseUrl(): string {
  // Browser: always use relative paths → same-origin via Next.js proxy
  if (typeof window !== "undefined") return "";

  const raw =
    process.env.NEXT_PUBLIC_NADAKKI_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "";
  return raw.trim().replace(/\/+$/, "");
}

/** Exported for unit tests — resolves relative Credit Hub paths against public API base. */
export function resolveCreditHubFetchUrl(path: string): string {
  const trimmedPath = path.trim();
  if (/^https?:\/\//i.test(trimmedPath)) return trimmedPath;
  const base = getCreditHubApiBaseUrl();
  const normalizedPath = trimmedPath.startsWith("/") ? trimmedPath : `/${trimmedPath}`;
  if (!base) return normalizedPath;
  return `${base}${normalizedPath}`;
}

function readBearerAccessToken(): string | null {
  const fromAuthV2 = tokenStorage.getAccessToken();
  if (fromAuthV2) return fromAuthV2;
  return getLocalStorageItem(LEGACY_ACCESS_TOKEN_STORAGE_KEY);
}

function getLocalStorageItem(key: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key);
}

function isMutationMethod(method: string): boolean {
  return ["POST", "PUT", "PATCH", "DELETE"].includes(method);
}

function randomUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (
      Number(c) ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(c) / 4)))
    ).toString(16)
  );
}

function responseMessage(body: unknown, fallback: string): string {
  const detail =
    body && typeof body === "object" && "detail" in body
      ? (body as { detail?: unknown }).detail
      : undefined;
  if (typeof detail === "string") return detail;
  if (detail && typeof detail === "object") return JSON.stringify(detail);
  return fallback;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  try {
    return await response.clone().json();
  } catch {
    return null;
  }
}

function redirectToLogin(): void {
  if (typeof window === "undefined") return;
  if (window.location.pathname.startsWith("/login")) return;
  window.location.href = "/login?next=" + encodeURIComponent(window.location.pathname);
}

export async function chFetch<T>(path: string, init: CHRequestInit): Promise<T> {
  if (!init.tenantId) throw new TenantRequiredError();

  const method = (init.method ?? "GET").toUpperCase();
  const isMutation = isMutationMethod(method);
  const dashboardRole = getLocalStorageItem(DASHBOARD_ROLE_KEY);
  if (isMutation && dashboardRole === "viewer") {
    throw new CHMutationForbiddenError();
  }

  const idemKey = init.idempotencyKey ?? (isMutation ? randomUUID() : undefined);
  const bearerAccessToken = readBearerAccessToken();
  const headers: Record<string, string> = {
    "X-Tenant-ID": init.tenantId,
    "X-Actor-Role": init.actorRole,
    ...(bearerAccessToken ? { Authorization: `Bearer ${bearerAccessToken}` } : {}),
    ...(idemKey ? { "Idempotency-Key": idemKey } : {}),
    ...(init.body ? { "Content-Type": "application/json" } : {}),
    ...(init.headers ?? {}),
  };

  const isRetry = headers["X-CH-Retry"] === "1";
  const controller = new AbortController();
  const timeoutMs = init.timeoutMs ?? 30_000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = resolveCreditHubFetchUrl(path);
    const response = await fetch(url, {
      ...init,
      method,
      headers,
      signal: controller.signal,
      credentials: "include",
    });

    const body = await parseResponseBody(response);
    throwIfChFeatureDisabled(response.status, body);

    if (response.status === 401) {
      redirectToLogin();
      throw new CHApiError("Unauthorized", 401);
    }

    if (response.status >= 500 && response.status < 600 && !isRetry) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return chFetch<T>(path, {
        ...init,
        headers: { ...headers, "X-CH-Retry": "1" },
      });
    }

    if (!response.ok) {
      throw new CHApiError(responseMessage(body, response.statusText), response.status);
    }

    return body as T;
  } catch (error) {
    if (error instanceof CHApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new CHApiError("Credit Hub request timed out", 408);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

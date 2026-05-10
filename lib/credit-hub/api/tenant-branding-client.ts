"use client";

import type { TenantBranding } from "@/lib/credit-hub/types/tenantBranding";

const SIC_TOKEN_KEY = "nadakki_sic_token";

// P10-05 fix BUG-002: fallback chain across the env var names that already exist
// in this repo. `_API_CONTRACT.md` documents `NEXT_PUBLIC_API_BASE_URL`, but
// most other clients (credit-api, spyfu, document-intelligence, autopilot,
// scheduler-status, legal/telemetry, public-consent-client) read
// `NEXT_PUBLIC_API_URL`. A handful of legacy callsites use
// `NEXT_PUBLIC_NADAKKI_API_BASE`. We accept all three so a stock `.env.local`
// from any path doesn't dead-end this client.
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_NADAKKI_API_BASE ||
  "";

/**
 * Base error class for all `tenant-branding` fetch failures. Always carries
 * a `referenceId` formatted ERR-<timestamp>-<rand4> so the user sees a stable
 * identifier in the UI for support escalation.
 */
export class TenantBrandingError extends Error {
  constructor(message: string, public readonly referenceId: string) {
    super(message);
    this.name = "TenantBrandingError";
  }
}

/**
 * Thrown when the backend returns 404 for a tenant id. Indicates the tenant
 * row does not exist (or the JWT carries a stale/invalid tenant id).
 */
export class TenantBrandingNotFoundError extends TenantBrandingError {
  constructor(tenantId: string, referenceId: string) {
    super(`Tenant '${tenantId}' not found`, referenceId);
    this.name = "TenantBrandingNotFoundError";
  }
}

/**
 * Thrown when the backend returns 403. Indicates a cross-tenant violation —
 * the JWT does not authorize access to the requested tenant id.
 */
export class TenantBrandingForbiddenError extends TenantBrandingError {
  constructor(tenantId: string, referenceId: string) {
    super(`Access to tenant '${tenantId}' forbidden`, referenceId);
    this.name = "TenantBrandingForbiddenError";
  }
}

/**
 * Thrown for transient network failures and 5xx responses. Retryable; the
 * error banner offers a Retry button which re-runs the react-query.
 */
export class TenantBrandingNetworkError extends TenantBrandingError {
  constructor(originalError: Error, referenceId: string) {
    super(`Network error: ${originalError.message}`, referenceId);
    this.name = "TenantBrandingNetworkError";
  }
}

/**
 * Reads the SIC bearer token from `localStorage` (browser only).
 * Returns null on the server or when no token is present.
 */
function readSicToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SIC_TOKEN_KEY);
}

/**
 * Builds the headers required by the tenant-branding endpoint per
 * `_API_CONTRACT.md` § "HEADERS REQUERIDOS". Reuses the same SIC token
 * pattern as `lib/credit-hub/api/client.ts` to avoid duplicate auth flows.
 */
function getAuthHeaders(tenantId: string): Record<string, string> {
  const token = readSicToken();
  return {
    "Content-Type": "application/json",
    "X-Tenant-ID": tenantId,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Generates a short, sortable error reference id of the form
 * `ERR-<unix-ms>-<XXXX>` where XXXX is 4 base-36 chars. Stable enough to
 * dedupe in support ticket triage but cheap enough to compute per request.
 */
function generateReferenceId(): string {
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ERR-${Date.now()}-${rand}`;
}

/**
 * Fetches the tenant branding payload from
 * `GET /api/v2/tenants/{tenant_id}/branding`.
 *
 * Maps HTTP status codes to typed error classes so consumers (banner
 * component, telemetry) can branch on `instanceof` without parsing strings.
 *
 * @param tenantId - tenant slug or UUID, never empty
 * @returns the parsed `TenantBranding` payload on 200
 * @throws {TenantBrandingNotFoundError} on HTTP 404
 * @throws {TenantBrandingForbiddenError} on HTTP 403
 * @throws {TenantBrandingNetworkError} on 5xx, network errors, or unknown failures
 */
export async function fetchTenantBranding(tenantId: string): Promise<TenantBranding> {
  const referenceId = generateReferenceId();

  if (!API_BASE) {
    throw new TenantBrandingNetworkError(
      new Error(
        "API base URL is not defined (set NEXT_PUBLIC_API_URL or NEXT_PUBLIC_API_BASE_URL)",
      ),
      referenceId,
    );
  }

  try {
    const response = await fetch(
      `${API_BASE}/api/v2/tenants/${encodeURIComponent(tenantId)}/branding`,
      { headers: getAuthHeaders(tenantId) },
    );

    if (response.status === 404) {
      throw new TenantBrandingNotFoundError(tenantId, referenceId);
    }
    if (response.status === 403) {
      throw new TenantBrandingForbiddenError(tenantId, referenceId);
    }
    if (!response.ok) {
      throw new TenantBrandingNetworkError(
        new Error(`HTTP ${response.status}`),
        referenceId,
      );
    }

    return (await response.json()) as TenantBranding;
  } catch (error) {
    if (error instanceof TenantBrandingError) throw error;
    const wrapped = error instanceof Error ? error : new Error(String(error));
    throw new TenantBrandingNetworkError(wrapped, referenceId);
  }
}

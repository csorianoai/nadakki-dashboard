/**
 * API client for the dealer multi-lender offers LIST endpoint.
 *
 * IMPORTANT base path note (verified against backend):
 *   GET /credit/applications/{id}/offers  (offers_router.py) is mounted WITHOUT
 *   the /api/v2 prefix — so it is literally "/credit/...", NOT "/api/v2/credit/...".
 *   This differs from creditCoreClient.ts (CREDIT_CORE_BASE = "/api/v2/credit"),
 *   which is why the list lives in its own client with OFFERS_BASE = "/credit".
 *
 * The acceptance endpoint (POST /api/v2/credit/.../offers/{offer_id}/accept) DOES
 * use the standard /api/v2/credit prefix and therefore lives in creditCoreClient.ts.
 *
 * Reuses the same fetch/timeout/error-handling shape as creditCoreFetch:
 *   - Bearer token (tokenStorage + legacy fallback key)
 *   - X-Tenant-ID header
 *   - 30s timeout with AbortController
 *   - throws the shared CreditCoreApiError so callers handle errors uniformly.
 *
 * Owner: Credit Hub Dealer. Task Packet: feat/dealer-offers-real.
 */
import { CreditCoreApiError } from "./creditCoreClient";
import { normalizeOffers } from "./normalizers";
import { tokenStorage } from "@/lib/auth/token-storage";
import type { OffersListResponse } from "../types/offers";

const OFFERS_BASE = "/credit";
const REQUEST_TIMEOUT_MS = 30_000;
const LEGACY_ACCESS_TOKEN_STORAGE_KEY = "nadakki_sic_token";

function readBearerAccessToken(): string | null {
  const fromAuthV2 = tokenStorage.getAccessToken();
  if (fromAuthV2) return fromAuthV2;
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(LEGACY_ACCESS_TOKEN_STORAGE_KEY);
}

async function parseResponseBody(response: Response): Promise<unknown> {
  try {
    return await response.clone().json();
  } catch {
    try {
      return await response.text();
    } catch {
      return null;
    }
  }
}

function responseMessage(body: unknown, fallback: string): string {
  if (typeof body === "string" && body.trim()) return body;
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    if (typeof record.message === "string") return record.message;
    if (typeof record.error === "string") return record.error;
    if (typeof record.detail === "string") return record.detail;
    if (record.detail) return JSON.stringify(record.detail);
  }
  return fallback || "Offers request failed";
}

async function offersFetch<T>(path: string, tenantId: string): Promise<T> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const bearerAccessToken = readBearerAccessToken();

  try {
    const response = await fetch(`${OFFERS_BASE}${path}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": tenantId,
        ...(bearerAccessToken ? { Authorization: `Bearer ${bearerAccessToken}` } : {}),
      },
      signal: controller.signal,
      credentials: "include",
    });
    const body = await parseResponseBody(response);

    if (!response.ok) {
      throw new CreditCoreApiError(responseMessage(body, response.statusText), response.status, body);
    }

    return body as T;
  } catch (error) {
    if (error instanceof CreditCoreApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new CreditCoreApiError("Offers request timed out", 408);
    }
    throw new CreditCoreApiError(error instanceof Error ? error.message : "Offers request failed", 0, error);
  } finally {
    window.clearTimeout(timeoutId);
  }
}

/**
 * List offers for an application. Passes limit/offset through (backend defaults
 * limit=20/offset=0); we only send them when explicitly provided to avoid
 * diverging from backend defaults.
 */
export async function listOffers(params: {
  tenantId: string;
  applicationId: string;
  limit?: number;
  offset?: number;
}): Promise<OffersListResponse> {
  const query = new URLSearchParams();
  if (typeof params.limit === "number") query.set("limit", String(params.limit));
  if (typeof params.offset === "number") query.set("offset", String(params.offset));
  const qs = query.toString();
  const path = `/applications/${encodeURIComponent(params.applicationId)}/offers${qs ? `?${qs}` : ""}`;
  const raw = await offersFetch<unknown>(path, params.tenantId);
  return normalizeOffers(raw);
}

import {
  normalizeApplication,
  normalizeApplications,
  normalizeEvents,
  normalizeOfferAcceptResult,
  normalizeStats,
} from "./normalizers";
import { tokenStorage } from "@/lib/auth/token-storage";
import type {
  CreateCreditApplicationPayload,
  CreditApplication,
  CreditEvent,
  CreditStats,
} from "../types/creditCore";
import type { OfferAcceptResult } from "../types/offers";

const CREDIT_CORE_BASE = "/api/v2/credit";
const REQUEST_TIMEOUT_MS = 30_000;
const LEGACY_ACCESS_TOKEN_STORAGE_KEY = "nadakki_sic_token";

export class CreditCoreApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public detail?: unknown
  ) {
    super(message);
    this.name = "CreditCoreApiError";
  }
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
  return fallback || "Credit Core request failed";
}

interface CreditCoreRequestInit extends Omit<RequestInit, "headers"> {
  tenantId: string;
  headers?: Record<string, string>;
}

function readBearerAccessToken(): string | null {
  const fromAuthV2 = tokenStorage.getAccessToken();
  if (fromAuthV2) return fromAuthV2;
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(LEGACY_ACCESS_TOKEN_STORAGE_KEY);
}

async function creditCoreFetch<T>(path: string, init: CreditCoreRequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const bearerAccessToken = readBearerAccessToken();

  try {
    const response = await fetch(`${CREDIT_CORE_BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": init.tenantId,
        ...(bearerAccessToken ? { Authorization: `Bearer ${bearerAccessToken}` } : {}),
        ...(init.headers ?? {}),
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
      throw new CreditCoreApiError("Credit Core request timed out", 408);
    }
    throw new CreditCoreApiError(error instanceof Error ? error.message : "Credit Core request failed", 0, error);
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function getCreditHealth(params: { tenantId: string }): Promise<unknown> {
  return creditCoreFetch("/health", {
    method: "GET",
    tenantId: params.tenantId,
  });
}

export async function getCreditStats(params: { tenantId: string }): Promise<CreditStats> {
  const raw = await creditCoreFetch<unknown>("/stats", {
    method: "GET",
    tenantId: params.tenantId,
  });
  return normalizeStats(raw);
}

export async function listApplications(params: { tenantId: string }): Promise<CreditApplication[]> {
  const raw = await creditCoreFetch<unknown>("/applications", {
    method: "GET",
    tenantId: params.tenantId,
  });
  return normalizeApplications(raw);
}

export async function createApplication(params: {
  tenantId: string;
  payload: CreateCreditApplicationPayload;
}): Promise<CreditApplication> {
  const raw = await creditCoreFetch<unknown>("/applications", {
    method: "POST",
    tenantId: params.tenantId,
    body: JSON.stringify({
      application_payload: params.payload,
      initial_state: "DRAFT",
    }),
  });
  return normalizeApplication(raw);
}

export async function getApplication(params: {
  tenantId: string;
  applicationId: string;
}): Promise<CreditApplication> {
  const raw = await creditCoreFetch<unknown>(`/applications/${encodeURIComponent(params.applicationId)}`, {
    method: "GET",
    tenantId: params.tenantId,
  });
  return normalizeApplication(raw);
}

export async function processApplication(params: {
  tenantId: string;
  applicationId: string;
  mode?: string;
}): Promise<CreditApplication> {
  const raw = await creditCoreFetch<unknown>(`/applications/${encodeURIComponent(params.applicationId)}/process`, {
    method: "POST",
    tenantId: params.tenantId,
    body: JSON.stringify(params.mode ? { mode: params.mode } : {}),
  });
  return normalizeApplication(raw);
}

export async function getApplicationEvents(params: {
  tenantId: string;
  applicationId: string;
}): Promise<CreditEvent[]> {
  const raw = await creditCoreFetch<unknown>(`/applications/${encodeURIComponent(params.applicationId)}/events`, {
    method: "GET",
    tenantId: params.tenantId,
  });
  return normalizeEvents(raw);
}

/**
 * Accept a specific offer for an application (dealer multi-lender flow).
 *
 * POST /api/v2/credit/applications/{applicationId}/offers/{offerId}/accept
 * (offer_acceptance_router.py) — base path matches CREDIT_CORE_BASE, so this
 * reuses creditCoreFetch. Idempotent on the backend (responds idempotent:true
 * on retries). Typed backend errors surface via CreditCoreApiError.detail, so
 * callers can show the real reason (e.g. offer already taken / invalid state).
 */
export async function acceptOffer(params: {
  tenantId: string;
  applicationId: string;
  offerId: string;
}): Promise<OfferAcceptResult> {
  const raw = await creditCoreFetch<unknown>(
    `/applications/${encodeURIComponent(params.applicationId)}/offers/${encodeURIComponent(params.offerId)}/accept`,
    {
      method: "POST",
      tenantId: params.tenantId,
      body: JSON.stringify({}),
    }
  );
  return normalizeOfferAcceptResult(raw);
}

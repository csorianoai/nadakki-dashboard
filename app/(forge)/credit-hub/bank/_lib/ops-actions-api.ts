"use client";

import { apiFetch } from "@/lib/api/fetch-client";

export interface CheckExpiryResult {
  expired_count?: number;
  expired_offers?: Array<{ offer_id?: string; lender_code?: string; expired_at?: string | null }>;
  checked_at?: string;
}

export interface SetOfferExpiryResult {
  offer_id?: string;
  offer_expires_at?: string;
  status?: string;
}

export interface StipulationRow {
  id: string;
  description?: string | null;
  type?: string;
  status?: string;
  sla_deadline?: string | null;
}

export interface LivenessResultPayload {
  status?: string;
  pad_score?: number | null;
  provider?: string | null;
  evidence_id?: string | null;
  requires_manual_review?: boolean;
  blocked?: boolean;
  detail?: string | null;
  trace_id?: string;
  application_id?: string;
}

export interface VinAnomaliesResult {
  vin?: string;
  anomalies?: Array<Record<string, unknown>>;
  anomaly_count?: number;
}

export async function readJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export function parseApiError(status: number, body: unknown): string {
  if (body && typeof body === "object" && body !== null) {
    const root = body as Record<string, unknown>;
    const detail = root.detail;
    if (typeof detail === "string") return detail;
    if (detail && typeof detail === "object") {
      const inner = detail as Record<string, unknown>;
      if (typeof inner.message === "string") return inner.message;
    }
    if (typeof root.message === "string") return root.message;
  }
  return `Error HTTP ${status}`;
}

export async function postCheckOfferExpiry(tid: string, applicationId: string): Promise<CheckExpiryResult> {
  const res = await apiFetch(
    `/api/v2/credit/applications/${encodeURIComponent(applicationId)}/offers/check-expiry`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "X-Tenant-ID": tid,
      },
    },
  );
  const body = await readJson(res);
  if (!res.ok) throw new Error(parseApiError(res.status, body));
  return (body ?? {}) as CheckExpiryResult;
}

export async function putOfferExpiry(
  tid: string,
  applicationId: string,
  offerId: string,
  expiresAt: string,
): Promise<SetOfferExpiryResult> {
  const res = await apiFetch(
    `/api/v2/credit/applications/${encodeURIComponent(applicationId)}/offers/${encodeURIComponent(offerId)}/expiry`,
    {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Tenant-ID": tid,
      },
      body: JSON.stringify({ expires_at: expiresAt }),
    },
  );
  const body = await readJson(res);
  if (!res.ok) throw new Error(parseApiError(res.status, body));
  return (body ?? {}) as SetOfferExpiryResult;
}

export async function postClearStipulation(
  tid: string,
  applicationId: string,
  stipulationId: string,
  reason?: string,
): Promise<unknown> {
  const res = await apiFetch(
    `/api/v2/credit/applications/${encodeURIComponent(applicationId)}/stipulations/${encodeURIComponent(stipulationId)}/clear`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Tenant-ID": tid,
      },
      body: JSON.stringify({ manual_override: true, reason: reason?.trim() || undefined }),
    },
  );
  const body = await readJson(res);
  if (!res.ok) throw new Error(parseApiError(res.status, body));
  return body;
}

export async function postIdentityLiveness(tid: string, applicationId: string): Promise<LivenessResultPayload> {
  const res = await apiFetch(
    `/api/v2/credit/applications/${encodeURIComponent(applicationId)}/identity/liveness`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Tenant-ID": tid,
      },
      body: JSON.stringify({ consent_granted: true, capture_kind: "passive_video" }),
    },
  );
  const body = await readJson(res);
  if (!res.ok) throw new Error(parseApiError(res.status, body));
  return (body ?? {}) as LivenessResultPayload;
}

export async function getVinAnomalies(tid: string, vin: string): Promise<VinAnomaliesResult> {
  const res = await apiFetch(`/api/v2/credit/vehicles/vin/${encodeURIComponent(vin)}/anomalies`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "X-Tenant-ID": tid,
    },
    cache: "no-store",
  });
  const body = await readJson(res);
  if (!res.ok) throw new Error(parseApiError(res.status, body));
  return (body ?? {}) as VinAnomaliesResult;
}

export interface OfferCompareDetailRow {
  offer_id: string;
  lender_code?: string;
  offer_status?: string;
  is_counteroffer?: boolean;
}

export async function getOfferCompareForOps(
  tid: string,
  applicationId: string,
): Promise<{ offers_detail?: OfferCompareDetailRow[] }> {
  const res = await apiFetch(
    `/api/v2/credit/applications/${encodeURIComponent(applicationId)}/offers/compare`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-Tenant-ID": tid,
      },
      cache: "no-store",
    },
  );
  const body = await readJson(res);
  if (!res.ok) throw new Error(parseApiError(res.status, body));
  return (body ?? {}) as { offers_detail?: OfferCompareDetailRow[] };
}

export async function getStipulationsForOps(tid: string, applicationId: string): Promise<StipulationRow[]> {
  const res = await apiFetch(`/api/v2/credit/applications/${encodeURIComponent(applicationId)}/stipulations`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "X-Tenant-ID": tid,
    },
    cache: "no-store",
  });
  const body = await readJson(res);
  if (!res.ok) throw new Error(parseApiError(res.status, body));
  if (body && typeof body === "object" && body !== null) {
    const root = body as Record<string, unknown>;
    if (Array.isArray(root.stipulations)) return root.stipulations as StipulationRow[];
  }
  if (Array.isArray(body)) return body as StipulationRow[];
  return [];
}

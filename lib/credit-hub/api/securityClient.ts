import { CHApiError, chFetch } from "./client";

export type IdentityVerificationStatus = "VERIFIED" | "MISMATCH" | "UNVERIFIED";

export interface IdentityVerificationResult {
  status: IdentityVerificationStatus;
  detail?: string;
  checked_at?: string;
  checks?: Array<{ field?: string; message?: string }>;
}

export type PreScreenStatus = "ELIGIBLE" | "ELIGIBLE_WITH_RESERVATIONS" | "NOT_ELIGIBLE";

export interface PreScreenResult {
  status: PreScreenStatus;
  checked_at?: string;
  full_report?: Record<string, unknown>;
}

export async function postVerifyIdentity(params: {
  tenantId: string;
  applicationId: string;
}): Promise<IdentityVerificationResult> {
  return chFetch<IdentityVerificationResult>(
    `/api/v2/credit/applications/${encodeURIComponent(params.applicationId)}/verify-identity`,
    { tenantId: params.tenantId, actorRole: "dealer", method: "POST", body: JSON.stringify({}) },
  );
}

export async function getVerifyIdentity(params: {
  tenantId: string;
  applicationId: string;
}): Promise<IdentityVerificationResult> {
  return chFetch<IdentityVerificationResult>(
    `/api/v2/credit/applications/${encodeURIComponent(params.applicationId)}/verify-identity`,
    { tenantId: params.tenantId, actorRole: "bank_analyst" },
  );
}

export async function postPreScreen(params: {
  tenantId: string;
  applicationId: string;
}): Promise<PreScreenResult> {
  return chFetch<PreScreenResult>(
    `/api/v2/credit/applications/${encodeURIComponent(params.applicationId)}/pre-screen`,
    { tenantId: params.tenantId, actorRole: "dealer", method: "POST", body: JSON.stringify({}) },
  );
}

export async function getPreScreen(params: {
  tenantId: string;
  applicationId: string;
}): Promise<PreScreenResult> {
  return chFetch<PreScreenResult>(
    `/api/v2/credit/applications/${encodeURIComponent(params.applicationId)}/pre-screen`,
    { tenantId: params.tenantId, actorRole: "bank_analyst" },
  );
}

export async function getVehicleHistory(params: { tenantId: string; vin: string }): Promise<{
  vin?: string;
  events?: Array<{ type?: string; label?: string; at?: string }>;
  alerts?: string[];
}> {
  return chFetch(`/api/v2/vehicles/history/${encodeURIComponent(params.vin)}`, {
    tenantId: params.tenantId,
    actorRole: "bank_analyst",
  });
}

export async function getApplicationCompliance(params: {
  tenantId: string;
  applicationId: string;
}): Promise<{
  status?: "CLEAR" | "MATCH_FOUND" | "REVIEW_PENDING";
  matches?: Array<{ name?: string; score?: number }>;
  score?: number;
}> {
  try {
    return await chFetch(
      `/api/v2/credit/applications/${encodeURIComponent(params.applicationId)}/compliance`,
      { tenantId: params.tenantId, actorRole: "bank_analyst" },
    );
  } catch (err) {
    if (err instanceof CHApiError && (err.status === 404 || err.status === 501)) {
      throw err;
    }
    throw err;
  }
}

export function isSecurityEndpointUnavailable(err: unknown): boolean {
  return err instanceof CHApiError && (err.status === 404 || err.status === 501);
}

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
  subject_id: string;
  subject_name: string;
  date_of_birth?: string;
}): Promise<IdentityVerificationResult> {
  return chFetch<IdentityVerificationResult>(
    `/api/v2/credit/applications/${encodeURIComponent(params.applicationId)}/verify-identity`,
    {
      tenantId: params.tenantId,
      actorRole: "dealer",
      method: "POST",
      body: JSON.stringify({
        subject_id: params.subject_id,
        subject_name: params.subject_name,
        date_of_birth: params.date_of_birth,
      }),
    },
  );
}

export async function postPreScreen(params: {
  tenantId: string;
  applicationId: string;
  subject_id: string;
  subject_name: string;
  consent_id?: string;
}): Promise<PreScreenResult> {
  return chFetch<PreScreenResult>(
    `/api/v2/credit/applications/${encodeURIComponent(params.applicationId)}/pre-screening`,
    {
      tenantId: params.tenantId,
      actorRole: "dealer",
      method: "POST",
      body: JSON.stringify({
        subject_id: params.subject_id,
        subject_name: params.subject_name,
        consent_id: params.consent_id,
      }),
    },
  );
}

export async function getVehicleHistory(params: { tenantId: string; vin: string }): Promise<{
  vin?: string;
  events?: Array<{ type?: string; label?: string; at?: string }>;
  alerts?: string[];
}> {
  return chFetch(`/api/v2/credit/vehicles/vin/${encodeURIComponent(params.vin)}/history`, {
    tenantId: params.tenantId,
    actorRole: "bank_analyst",
  });
}

export interface ComplianceScreeningResultItem {
  list_code?: string;
  result?: string;
  match_score?: number;
  match_name?: string | null;
  screened_at?: string;
}

export interface ComplianceResultsResponse {
  application_id?: string;
  results?: ComplianceScreeningResultItem[];
  count?: number;
}

export async function postComplianceScreen(params: {
  tenantId: string;
  applicationId: string;
  subject_name: string;
  subject_id_number?: string;
}): Promise<{
  screening_id?: string;
  overall_result?: string;
  compliance_action?: string;
  results?: ComplianceScreeningResultItem[];
  screened_at?: string;
}> {
  return chFetch(
    `/api/v2/credit/applications/${encodeURIComponent(params.applicationId)}/compliance/screen`,
    {
      tenantId: params.tenantId,
      actorRole: "bank_analyst",
      method: "POST",
      body: JSON.stringify({
        subject_name: params.subject_name,
        subject_id_number: params.subject_id_number,
      }),
    },
  );
}

export async function getComplianceResults(params: {
  tenantId: string;
  applicationId: string;
}): Promise<ComplianceResultsResponse> {
  return chFetch<ComplianceResultsResponse>(
    `/api/v2/credit/applications/${encodeURIComponent(params.applicationId)}/compliance/results`,
    { tenantId: params.tenantId, actorRole: "bank_analyst" },
  );
}

/** Map backend screening rows to UI status used by VerificationsTab. */
export function complianceStatusFromResults(
  results: ComplianceScreeningResultItem[] | undefined,
): "CLEAR" | "MATCH_FOUND" | "REVIEW_PENDING" | null {
  const rows = results ?? [];
  if (rows.length === 0) return null;
  const hasMatch = rows.some((r) => String(r.result ?? "").toUpperCase().includes("MATCH"));
  if (hasMatch) return "MATCH_FOUND";
  const pending = rows.some((r) => String(r.result ?? "").toUpperCase().includes("PENDING"));
  if (pending) return "REVIEW_PENDING";
  return "CLEAR";
}

export function complianceMatchesFromResults(
  results: ComplianceScreeningResultItem[] | undefined,
): Array<{ name?: string; score?: number }> {
  return (results ?? [])
    .filter((r) => String(r.result ?? "").toUpperCase().includes("MATCH"))
    .map((r) => ({ name: r.match_name ?? r.list_code, score: r.match_score }));
}

export function isSecurityEndpointUnavailable(err: unknown): boolean {
  return err instanceof CHApiError && (err.status === 404 || err.status === 501);
}

import { chFetch } from "./client";

/** OpenAPI: EscalateRequest */
export interface EscalateReviewBody {
  reason: string;
  notes?: string;
}

/** OpenAPI: EscalateResponse */
export interface EscalateReviewResult {
  escalation_id: string;
  status: string;
  assigned_to?: string | null;
  event_type: string;
  application_id: string;
  created_at: string;
}

export async function escalateKycReview(params: {
  tenantId: string;
  applicationId: string;
  body: EscalateReviewBody;
}): Promise<EscalateReviewResult> {
  return chFetch<EscalateReviewResult>(
    `/api/v2/credit/applications/${encodeURIComponent(params.applicationId)}/kyc/escalate-review`,
    {
      tenantId: params.tenantId,
      actorRole: "bank_analyst",
      method: "POST",
      body: JSON.stringify({ reason: params.body.reason, notes: params.body.notes ?? "" }),
    },
  );
}

export async function escalateOcrReview(params: {
  tenantId: string;
  applicationId: string;
  docId: string;
  body: EscalateReviewBody;
}): Promise<EscalateReviewResult> {
  return chFetch<EscalateReviewResult>(
    `/api/v2/credit/applications/${encodeURIComponent(params.applicationId)}/documents/${encodeURIComponent(params.docId)}/ocr/escalate-review`,
    {
      tenantId: params.tenantId,
      actorRole: "bank_analyst",
      method: "POST",
      body: JSON.stringify({ reason: params.body.reason, notes: params.body.notes ?? "" }),
    },
  );
}

import { CHApiError, chFetch } from "./client";
import type { ExpedienteFullResponse } from "../types/expediente";
import { expedienteToBankReviewApplication } from "../utils/expedienteAdapter";
import type {
  BankActorRole,
  BankAuditTrail,
  BankBulkRule,
  BankDashboardAnalytics,
  BankDecision,
  BankDecisionRequest,
  BankDecisionType,
  BankQueueResponse,
  BankReviewApplication,
  BulkDecisionResult,
  ComplianceReport,
  CounterOffer,
} from "../types/bankDecision";

const actorRole: BankActorRole = "bank_analyst";

/**
 * Map legacy Spanish decision values to backend enum.
 * Backend DecideRequest expects: "APPROVE" | "REJECT" | "COUNTER".
 */
const DECISION_TYPE_MAP: Record<BankDecisionType, string> = {
  APROBADO: "APPROVE",
  RECHAZADO: "REJECT",
  CONTRA_OFERTA: "COUNTER",
  EN_REVISION: "COUNTER", // treated as counter with no_match
};

/** Default reason code per decision type (backend requires min 1). */
const DEFAULT_REASON_CODE: Record<string, string[]> = {
  APPROVE: ["RC001_APPROVE"],
  REJECT: ["RC101_REJECT_CREDIT_POLICY"],
  COUNTER: ["RC201_COUNTER_AMOUNT"],
};

/**
 * Transform legacy BankDecisionRequest → backend DecideRequest.
 *
 * Audit #4.2: The legacy payload sent `decision` (Spanish) + flat `terms`.
 * The backend expects `decision_type` (English enum) + `counter_terms`
 * (only for COUNTER) + `reason_codes` (required, min 1).
 */
function toBankDecideRequestBody(legacy: BankDecisionRequest): Record<string, unknown> {
  const decisionType = DECISION_TYPE_MAP[legacy.decision] ?? legacy.decision;
  const reasonCodes = DEFAULT_REASON_CODE[decisionType] ?? ["RC001_APPROVE"];

  const body: Record<string, unknown> = {
    decision_type: decisionType,
    reason_codes: reasonCodes,
    notes: legacy.justification || "",
    adverse_action: decisionType === "REJECT",
  };

  if (decisionType === "COUNTER") {
    body.counter_terms = {
      amount: legacy.terms.approved_amount,
      interest_rate: legacy.terms.interest_rate,
      term_months: legacy.terms.term_months,
      down_payment: legacy.terms.down_payment_required,  // FIXED: was down_payment_pct, should be down_payment (amount in pesos, not %)
      no_match: legacy.decision === "EN_REVISION",
    };
  }

  if (decisionType === "APPROVE" && legacy.terms.conditions.length > 0) {
    body.stipulations = legacy.terms.conditions.map((cond, i) => ({
      code: `STIP-${i + 1}`,
      description: cond,
    }));
  }

  return body;
}

export type BankQueueRequestParams = {
  tenantId: string;
  limit?: number;
  offset?: number;
  filters?: Record<string, string>;
};

export function getQueue(params: BankQueueRequestParams): Promise<BankQueueResponse> {
  const search = new URLSearchParams();
  if (params.limit != null) search.set("limit", String(params.limit));
  if (params.offset != null) search.set("offset", String(params.offset));
  if (params.filters) {
    for (const [key, value] of Object.entries(params.filters)) {
      const trimmed = String(value ?? "").trim();
      if (trimmed) search.set(key, trimmed);
    }
  }
  const query = search.toString() ? `?${search.toString()}` : "";
  return chFetch<BankQueueResponse>(`/api/v2/credit/applications/queue${query}`, {
    tenantId: params.tenantId,
    actorRole,
  });
}

export function getApplicationForReview(params: {
  tenantId: string;
  applicationId: string;
}): Promise<BankReviewApplication> {
  return chFetch<BankReviewApplication>(`/api/v2/credit/applications/${encodeURIComponent(params.applicationId)}`, {
    tenantId: params.tenantId,
    actorRole,
  });
}

export function getExpedienteFull(params: {
  tenantId: string;
  applicationId: string;
}): Promise<ExpedienteFullResponse> {
  return chFetch<ExpedienteFullResponse>(
    `/api/v2/credit/applications/${encodeURIComponent(params.applicationId)}/expediente/full`,
    { tenantId: params.tenantId, actorRole },
  );
}

/** Prefer expediente/full; fall back to canonical application GET on 403/404. */
export async function getBankApplicationDetail(params: {
  tenantId: string;
  applicationId: string;
}): Promise<BankReviewApplication> {
  try {
    const ex = await getExpedienteFull(params);
    return expedienteToBankReviewApplication(ex);
  } catch (err) {
    if (err instanceof CHApiError && (err.status === 403 || err.status === 404)) {
      return getApplicationForReview(params);
    }
    throw err;
  }
}

/**
 * Claim-before-decide (Audit #4.6).
 *
 * Backend requires POST /claim before POST /decide. Instead of relying on
 * useEffect (which failed in production — 0 invocations despite being in
 * bundle), we claim atomically right before deciding in the handler itself.
 *
 * Idempotent: self-retry returns 200, so calling claim on every decide is safe.
 * 409 = another analyst owns it → throw (correct behavior, cannot decide).
 */
export async function recordDecision(params: {
  tenantId: string;
  applicationId: string;
  body: BankDecisionRequest;
}): Promise<BankDecision> {
  const analystId = params.body.analyst_id || "unknown";
  const appPath = `/api/v2/credit/applications/${encodeURIComponent(params.applicationId)}`;

  // Step 1: Claim (idempotent — self-retry = 200, other-analyst = 409 throw)
  console.log("[claim-before-decide] attempting claim", {
    applicationId: params.applicationId,
    analystId,
    decisionType: params.body.decision,
  });
  await chFetch<unknown>(`${appPath}/claim`, {
    tenantId: params.tenantId,
    actorRole,
    method: "POST",
    body: JSON.stringify({
      analyst_id: analystId,
      ...(params.body.lender_code?.trim() ? { lender_code: params.body.lender_code.trim() } : {}),
    }),
  });
  console.log("[claim-before-decide] claim succeeded, proceeding to decide");

  // Step 2: Decide (app is now claimed by us)
  const backendBody = toBankDecideRequestBody(params.body);
  return chFetch<BankDecision>(`${appPath}/decide`, {
    tenantId: params.tenantId,
    actorRole,
    method: "POST",
    body: JSON.stringify(backendBody),
  });
}

export function getCounterOffer(params: { tenantId: string; applicationId: string }): Promise<CounterOffer> {
  return chFetch<CounterOffer>(`/api/v2/credit/applications/${encodeURIComponent(params.applicationId)}/counter-offer`, {
    tenantId: params.tenantId,
    actorRole,
  });
}

export function bulkDecide(params: {
  tenantId: string;
  applicationIds: string[];
  rule: BankBulkRule;
  analystId: string;
  justification: string;
}): Promise<BulkDecisionResult> {
  return chFetch<BulkDecisionResult>("/api/v2/credit/applications/bulk-decide", {
    tenantId: params.tenantId,
    actorRole,
    method: "POST",
    body: JSON.stringify({
      application_ids: params.applicationIds,
      rule: params.rule,
      analyst_id: params.analystId,
      justification: params.justification,
    }),
  });
}

export function getAnalytics(params: { tenantId: string; period?: string }): Promise<BankDashboardAnalytics> {
  const query = params.period ? `?period=${encodeURIComponent(params.period)}` : "";
  return chFetch<BankDashboardAnalytics>(`/api/v2/credit/analytics/dashboard${query}`, {
    tenantId: params.tenantId,
    actorRole: "bank_admin",
  });
}

export function getDealersRanking(params: { tenantId: string }): Promise<{ dealers: BankDashboardAnalytics["top_dealers"] }> {
  return chFetch<{ dealers: BankDashboardAnalytics["top_dealers"] }>("/api/v2/credit/analytics/dealers-ranking", {
    tenantId: params.tenantId,
    actorRole: "bank_admin",
  });
}

export function getPortfolioHealth(params: { tenantId: string }): Promise<Record<string, unknown>> {
  return chFetch<Record<string, unknown>>("/api/v2/credit/analytics/portfolio-health", {
    tenantId: params.tenantId,
    actorRole: "bank_admin",
  });
}

export function getComplianceReport(params: { tenantId: string; applicationId: string }): Promise<ComplianceReport> {
  return chFetch<ComplianceReport>(`/api/v2/credit/compliance/${encodeURIComponent(params.applicationId)}`, {
    tenantId: params.tenantId,
    actorRole: "compliance_officer",
  });
}

export async function getAuditTrail(params: { tenantId: string; applicationId: string }): Promise<BankAuditTrail> {
  const url = `/api/v2/credit/applications/${encodeURIComponent(params.applicationId)}/audit-trail`;
  console.log("[getAuditTrail] FETCH START", { url, tenantId: params.tenantId, applicationId: params.applicationId });
  
  const result = await chFetch<BankAuditTrail>(url, {
    tenantId: params.tenantId,
    actorRole,
  });
  
  console.log("[getAuditTrail] FETCH COMPLETE", {
    url,
    resultType: typeof result,
    hasEvents: Array.isArray(result?.events),
    eventsLength: result?.events?.length ?? 0,
    result,
  });
  
  return result;
}

export interface ComplianceApproval {
  status: "approved";
  approved_at: string;
  approved_by: string;
}

/** Check compliance approval stamped in application payload (Ley 172-13). */
export function isComplianceApproved(application: Pick<BankReviewApplication, "application_payload"> | null | undefined): boolean {
  const ca = application?.application_payload?.compliance_approval as { status?: string } | undefined;
  return ca?.status === "approved";
}

/**
 * Approve compliance for an application (Sub-K / PR #313).
 * Idempotent on backend — safe to call when already approved.
 */
export async function approveCompliance(params: {
  tenantId: string;
  applicationId: string;
  notes?: string;
}): Promise<{ ok: true; compliance: ComplianceApproval } | { ok: false; error: string }> {
  try {
    const data = await chFetch<{ compliance: ComplianceApproval }>(
      `/api/v2/credit/applications/${encodeURIComponent(params.applicationId)}/compliance/approve`,
      {
        tenantId: params.tenantId,
        actorRole: "compliance_officer",
        method: "POST",
        body: JSON.stringify({ notes: params.notes ?? "Compliance verified - Ley 172-13" }),
      }
    );
    return { ok: true, compliance: data.compliance };
  } catch (err) {
    const error = err instanceof Error ? err.message : "unknown";
    return { ok: false, error };
  }
}

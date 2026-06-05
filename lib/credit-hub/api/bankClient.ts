import { chFetch } from "./client";
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
      down_payment_pct: legacy.terms.down_payment_required,
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

export function recordDecision(params: {
  tenantId: string;
  applicationId: string;
  body: BankDecisionRequest;
}): Promise<BankDecision> {
  const backendBody = toBankDecideRequestBody(params.body);
  return chFetch<BankDecision>(`/api/v2/credit/applications/${encodeURIComponent(params.applicationId)}/decide`, {
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

export function getAuditTrail(params: { tenantId: string; applicationId: string }): Promise<BankAuditTrail> {
  return chFetch<BankAuditTrail>(`/api/v2/credit/applications/${encodeURIComponent(params.applicationId)}/audit-trail`, {
    tenantId: params.tenantId,
    actorRole,
  });
}

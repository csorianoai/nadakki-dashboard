/**
 * Cap 11 credit offers types.
 * Source of truth: nadakki-ai-suite routers/credit/{offers,multi_dispatch}_router.py
 *                  + services/credit/canonical_offer.py
 *                  + services/credit/dispatch_result.py
 * MVP scope: read offers list + dispatch to multiple lenders.
 * V1+ extensions tracked en ADR-004 Phase V1-F.
 */

/* ============================================================================
 * Lender codes — Known lender codes from production AdapterFactory _REGISTRY
 * ========================================================================== */

export type LenderCode =
  | "credicefi"
  | "pilot"
  | (string & {}); // future codes; preserves autocomplete on known values

/* ============================================================================
 * Offer status (CanonicalOfferStatus from TP-005)
 * ========================================================================== */

/**
 * Backend mapping (canonical_offer.py):
 * - "approved"      → bank decision APPROVE
 * - "counter_offer" → bank decision REVIEW (or DB status counter_offer/conditional/conditioned)
 * - "declined"      → bank decision DECLINE
 * - "pending"       → default/unknown, awaiting bank response
 */
export type OfferStatus =
  | "approved"
  | "counter_offer"
  | "declined"
  | "pending";

/* ============================================================================
 * Dispatch status (DispatchResult.status from TP-002 real + TP-007)
 * ========================================================================== */

export type DispatchStatus =
  | "dispatched"
  | "failed"
  | "timeout"
  | "idempotent_hit";

/* ============================================================================
 * GET /credit/applications/{id}/offers — Response types
 * ========================================================================== */

/** Single offer row exposed via HTTP. Source: OfferRow Pydantic model. */
export interface Offer {
  /** Deterministic UUID5 generated from (application_id, tenant:lender:trace_id) */
  id: string;
  application_id: string;
  tenant_id: string;
  lender_code: LenderCode;
  /** Loan amount approved (DOP for RD tenants). Null if pending/declined. */
  amount_approved: number | null;
  /** Annual percentage rate. Null if pending/declined. */
  interest_rate_apr: number | null;
  /** Loan term in months. Null if pending/declined. */
  term_months: number | null;
  /** Monthly payment amount. Null if pending/declined. */
  monthly_payment: number | null;
  status: OfferStatus;
  /** ISO 8601 timestamp with timezone */
  created_at: string;
}

/** Response from GET /credit/applications/{id}/offers. */
export interface OffersResponse {
  application_id: string;
  tenant_id: string;
  offers: Offer[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export interface ListOffersParams {
  /** Default 20, max 100, min 1 */
  limit?: number;
  /** Default 0, must be >= 0 */
  offset?: number;
}

/* ============================================================================
 * POST /credit/dispatch-multi — Request/Response types
 * ========================================================================== */

export interface DispatchMultiRequest {
  application_id: string;
  /** Arbitrary JSON application data forwarded to bank adapters as-is */
  application_data: Record<string, unknown>;
  /**
   * Optional idempotency key. If provided, identical key returns cached results
   * (status="idempotent_hit"). Server sanitizes ":" → "_".
   * Recommended: `${application_id}-${timestamp}-${attempt}` pattern.
   */
  idempotency_key?: string | null;
  /** Per-lender timeout in seconds. Default 30.0, range [0.1, 600.0]. */
  per_lender_timeout_seconds?: number;
}

export interface DispatchResult {
  lender_code: LenderCode;
  application_id: string;
  status: DispatchStatus;
  /** Full BankDecisionOutput payload, or null if failed/timeout */
  response: Record<string, unknown> | null;
  error: string | null;
  dispatched_at: string;
}

export interface DispatchMultiResponse {
  application_id: string;
  tenant_id: string;
  results: DispatchResult[];
  summary: {
    total_lenders: number;
    dispatched: number;
    failed: number;
    timeout: number;
    idempotent_hit: number;
  };
}

/* ============================================================================
 * HTTP Headers contract
 * ========================================================================== */

export interface CreditEndpointHeaders {
  "X-Tenant-ID": string;
  /** Reserved for V1-F-3 (Tenant identity middleware). MVP: optional. */
  "X-Role"?: "BANK_ANALYST" | "DEALER" | "ADMIN" | string;
}

export interface CreditApiError {
  detail: string | Array<{ loc: string[]; msg: string; type: string }>;
}

/* ============================================================================
 * Type guards
 * ========================================================================== */

export const isApprovedOffer = (o: Offer): boolean => o.status === "approved";
export const isCounterOffer = (o: Offer): boolean => o.status === "counter_offer";
export const isDeclinedOffer = (o: Offer): boolean => o.status === "declined";
export const isPendingOffer = (o: Offer): boolean => o.status === "pending";
export const isDispatchedResult = (r: DispatchResult): boolean =>
  r.status === "dispatched";
export const isIdempotentHit = (r: DispatchResult): boolean =>
  r.status === "idempotent_hit";

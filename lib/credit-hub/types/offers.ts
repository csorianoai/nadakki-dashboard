/**
 * Shared types for the dealer multi-lender offers flow.
 *
 * Purpose: model the canonical offer shape (TP-005, "Tier 1 approved 2026-05-15",
 *   nadakki-ai-suite/services/credit/canonical_offer.py) returned by:
 *     - GET  /credit/applications/{id}/offers                  (offers_router.py)
 *     - POST /api/v2/credit/applications/{id}/offers/{offer_id}/accept
 *            (offer_acceptance_router.py)
 *
 * Kept in a dedicated file (rather than creditCore.ts) because the offers domain
 * is new and self-contained; creditCore.ts already carries the application/event/
 * stats shapes. Owner: Credit Hub Dealer. Task Packet: feat/dealer-offers-real.
 */

export type CreditOfferStatus =
  | "approved"
  | "counter_offer"
  | "declined"
  | "pending"
  | "accepted"
  | "not_selected"
  | (string & {});

/** Canonical offer row (TP-005), defensively normalized for the frontend. */
export interface CreditOffer {
  id: string;
  application_id: string;
  tenant_id: string | null;
  lender_code: string;
  /** Human-readable bank name from terms.lender_display_name or title-cased lender_code. */
  lender_display_name: string | null;
  amount_approved: number | null;
  interest_rate_apr: number | null;
  term_months: number | null;
  monthly_payment: number | null;
  /** Total cost over the life of the loan (principal + interest). */
  total_cost: number | null;
  /** Currency code (e.g. DOP, MXN). */
  currency: string | null;
  /** Stipulations required by the lender (e.g. insurance). */
  stipulations: string[];
  status: CreditOfferStatus;
  created_at: string;
  raw: unknown;
}

export interface OffersPagination {
  limit: number;
  offset: number;
  total: number;
}

/** Normalized response of GET /credit/applications/{id}/offers. */
export interface OffersListResponse {
  application_id: string;
  tenant_id: string | null;
  offers: CreditOffer[];
  pagination: OffersPagination;
}

/** Accepted-offer detail echoed back by the acceptance endpoint. */
export interface AcceptedOfferDetail {
  offer_id: string;
  application_id: string;
  tenant_id: string | null;
  lender_code: string;
  status: string;
  terms: Record<string, unknown>;
  accepted_at: string | null;
  accepted_by: string | null;
}

/** Normalized response of POST .../offers/{offer_id}/accept. */
export interface OfferAcceptResult {
  ok: boolean;
  idempotent: boolean;
  offer: AcceptedOfferDetail;
  application_state: string | null;
  previous_application_state: string | null;
  /** How many sibling offers were auto-marked not_selected on acceptance. */
  siblings_not_selected: number | null;
  raw: unknown;
}

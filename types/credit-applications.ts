/**
 * Credit application types — minimal MVP shape.
 * Source: nadakki-ai-suite services/credit/persistence_db.py (credit_applications table).
 * V1 expansion: full applicant + vehicle + employment models per ADR-004 V1-A.
 */

/** Backend state machine 10 estados (Prohibido 2 — NEVER modify client-side) */
export type ApplicationStatus =
  | "DRAFT"
  | "RECEIVED"
  | "AI_ANALYSIS"
  | "AI_COMPLETE"
  | "BANK_SUBMITTED"
  | "BANK_COMPLETE"
  | "HYBRID_IN_PROGRESS"
  | "OFFER_SELECTED"
  | "COMPLETED"
  | "FAILED";

export interface Application {
  id: string;
  tenant_id: string;
  /** Correlation ID for log tracing */
  trace_id: string;
  status: ApplicationStatus;
  /** Free-form JSONB payload — schema not enforced MVP */
  application_payload: Record<string, unknown>;
  created_at: string;
}

/** Best-effort hints for application_payload structure. NOT enforced server-side MVP. */
export interface ApplicationPayloadHints {
  applicant?: {
    full_name?: string;
    email?: string;
    phone?: string;
    document_id?: string;
  };
  vehicle?: {
    make?: string;
    model?: string;
    year?: number;
    vin?: string;
    price?: number;
  };
  loan?: {
    amount_requested?: number;
    term_months_requested?: number;
    down_payment?: number;
  };
  employment?: {
    employer?: string;
    position?: string;
    monthly_income?: number;
    employment_type?: "salaried" | "self_employed" | "other";
  };
  [k: string]: unknown;
}

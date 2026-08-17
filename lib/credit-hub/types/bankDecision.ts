import type { CreditAnalysisResult } from "./creditAnalysis";

export type BankActorRole = "bank_analyst" | "bank_admin" | "compliance_officer";
export type BankDecisionType = "APROBADO" | "RECHAZADO" | "CONTRA_OFERTA" | "EN_REVISION";
export type BankBulkRule = "APROBAR_SCORE_GTE_800" | "RECHAZAR_SCORE_LT_580" | "REVISAR_BORDERLINE" | "SOLICITAR_DOCUMENTOS";

export interface BankDecisionTerms {
  approved_amount: number;
  interest_rate: number;
  term_months: number;
  down_payment_required: number;
  conditions: string[];
}

export interface BankDecision {
  decision: BankDecisionType;
  decided_at: string;
  decided_by: string;
  justification: string;
  terms: BankDecisionTerms;
  ai_score_at_decision: number;
  override_ai: boolean;
  override_reason: string | null;
  compliance_check: {
    ley_172_13_compliant: boolean;
    consents_complete: boolean;
    documents_complete: boolean;
  };
  audit_required: boolean;
  version: "1.0.0";
  engine: "forge_bank_decision_v1";
}

export interface BankQueueItem {
  application_id: string;
  tenant_id: string;
  state: string;
  applicant_name: string | null;
  dealer_id: string | null;
  dealer_name: string | null;
  vehicle_label: string | null;
  requested_amount: number;
  score: number;
  risk_level: string | null;
  approval_band: string | null;
  priority: "ALTA" | "MEDIA" | "BAJA";
  created_at: string | null;
  bank_decision: BankDecision | null;
  last_message_sender?: "BANK" | "DEALER" | null;
  last_message_at?: string | null;
  pendiente_respuesta_banco?: number;
}

export interface BankQueueResponse {
  applications: BankQueueItem[];
  /** Legacy total field from API. */
  total: number;
  /** Paginated queue total (PR #307); preferred when present. */
  total_count?: number;
  tenant_id: string;
}

export interface BankReviewApplication {
  application_id: string;
  tenant_id: string;
  state: string;
  application_payload: {
    analysis?: CreditAnalysisResult;
    bank_decision?: BankDecision;
    audit_trail?: BankAuditEvent[];
    [key: string]: unknown;
  };
}

export interface BankDecisionRequest {
  decision: BankDecisionType;
  justification: string;
  analyst_id: string;
  terms: BankDecisionTerms;
}

export interface CounterOffer {
  application_id: string;
  score: number;
  original_terms: BankDecisionTerms;
  counter_offer_terms: BankDecisionTerms;
  rate_adjustment_bps: number;
  explanation: string;
  generated_at: string;
}

export interface BulkDecisionResult {
  rule: BankBulkRule;
  processed: number;
  skipped: number;
  errors: number;
  results: Array<{
    application_id: string;
    status: "processed" | "skipped" | "error";
    decision: BankDecisionType | null;
    message: string;
  }>;
}

export interface BankAuditEvent {
  event: string;
  timestamp: string;
  by: string;
  decision?: BankDecisionType;
}

export interface BankAuditTrail {
  application_id: string;
  has_analysis: boolean;
  has_bank_decision: boolean;
  events: BankAuditEvent[];
  event_count?: number;
  audited_at?: string;
}

export interface ComplianceReport {
  application_id: string;
  ley_172_13_compliant: boolean;
  consent_data_processing: boolean;
  consent_bureau_authorization: boolean;
  consent_terms_accepted: boolean;
  consents_complete: boolean;
  documents_complete: boolean;
  data_retention_policy: string;
  right_to_be_forgotten: string;
  issues: Array<{ type: string; severity: string; action_required: string }>;
  generated_at: string;
}

export interface BankDashboardAnalytics {
  applications_by_status: Record<string, number>;
  approval_rate: number;
  avg_decision_time_hours: number | null;
  top_dealers: Array<{ dealer: string; volume: number; approved: number; approval_rate: number }>;
  portfolio_value: number;
  default_prediction: {
    rule: string;
    predicted_default_count: number;
    predicted_default_rate: number;
  };
  cohort_analysis: Array<{ period: string; applications: number; approved: number; approval_rate: number }>;
  total_applications: number;
}

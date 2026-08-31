export type BankDecisionType = "APPROVE" | "REJECT" | "COUNTER";

export interface CounterTermsPayload {
  amount?: number;
  interest_rate?: number;
  term_months?: number;
  down_payment_pct?: number;
  /** When true, treated as adverse / no underwriting match path per SPEC-005 embedding */
  no_match?: boolean;
}

export interface ApprovedTermsPayload {
  approved_amount?: number;
  interest_rate?: number;
  term_months?: number;
}

export interface DecideStipulation {
  id?: string;
  description: string;
  status?: string;
}

export interface BankDecideRequestBody {
  decision_type: BankDecisionType;
  reason_codes: string[];
  stipulations?: DecideStipulation[];
  counter_terms?: CounterTermsPayload | null;
  approved_terms?: ApprovedTermsPayload | null;
  adverse_action?: boolean;
  notes?: string;
}

export interface BankDecideResponse {
  decision_id: string;
  application_id: string;
  decision_type: string;
  decided_at: string;
  event_id?: string;
  adverse_action_letter_url?: string | null;
  counter_offer_id?: string | null;
}

export interface DecideFormValidationIssues {
  fieldErrors: Record<string, string>;
  formError?: string;
}

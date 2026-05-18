export interface BankApplicationTenantThresholds {
  pti_green_max?: number;
  pti_amber_max?: number;
  pti_red_min?: number;
  dti_green_max?: number;
  dti_amber_max?: number;
  dti_red_min?: number;
}

export interface BankApplicationScoring {
  pti?: number;
  dti?: number;
  internal_score?: number;
  bureau_score?: number;
  tenant_thresholds?: BankApplicationTenantThresholds;
}

export interface BankApplicationDocument {
  id?: string;
  name?: string;
  status?: string;
  type?: string;
}

export interface BankApplicationStipulation {
  id?: string;
  description?: string;
  status?: string;
}

export interface BankApplicationEvent {
  at?: string;
  type?: string;
  summary?: string;
  message?: string;
}

export interface BankApplicationClaim {
  claimed_by?: string | null;
  /** Analyst UUID for X-Actor-ID on decide (EP-13) */
  analyst_id?: string | null;
  claimed_at?: string | null;
  current_user_owns?: boolean;
}

export interface BankApplicationDetailResponse {
  application_id: string;
  queue_status: string;
  borrower_name_masked: string;
  amount: number;
  currency: string;
  dealer: {
    id: string;
    name: string;
    location?: string;
  };
  borrower: {
    dob_year?: number;
    cedula_masked?: string;
    income_monthly?: number;
    employment?: {
      employer?: string;
      position?: string;
      tenure_months?: number;
    };
  };
  vehicle: {
    year?: number;
    make?: string;
    model?: string;
    vin?: string;
    dealer_location?: string;
  };
  scoring: BankApplicationScoring;
  prior_decisions?: unknown[];
  documents?: BankApplicationDocument[];
  stipulations?: BankApplicationStipulation[];
  events_count?: number;
  recent_events?: BankApplicationEvent[];
  bank_claim?: BankApplicationClaim;
  notes?: string | null;
  last_process_result?: Record<string, unknown> | null;
  /** Optional SLA fields if backend adds them */
  sla_deadline?: string;
  hours_until_sla?: number;
}

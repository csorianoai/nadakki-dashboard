export interface CreditKpi {
  key: string;
  label: string;
  value: number | string | null;
  unit?: string;
}

export interface CreditDashboardResponse {
  data_source?: "live" | "none";
  kpis?: CreditKpi[];
  weekly_trend?: Array<{ week: string; count: number }>;
  status_distribution?: Array<{ state: string; count: number }>;
  monthly_amounts?: Array<{ month: string; amount: number }>;
}

export interface CreditRequestRow {
  application_id: string;
  tenant_name?: string;
  dealer_name?: string;
  applicant_name?: string;
  state?: string;
  requested_amount?: number;
  created_at?: string;
}

export interface CreditRequestsResponse {
  data_source?: "live" | "none";
  items: CreditRequestRow[];
  total?: number;
  page?: number;
  page_size?: number;
}

export interface CreditRequestFilters {
  scope?: "network" | "tenant";
  tenant_id?: string;
  state?: string;
  dealer_id?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}

export interface CreditAmlResponse {
  data_source?: "live" | "none";
  matches_today?: number;
  screenings_today?: number;
  open_reviews?: number;
}

export interface CreditDealerRankingResponse {
  data_source?: "live" | "none";
  dealers: Array<{ dealer_name: string; volume: number; approval_rate?: number }>;
}

export interface CreditAuditResponse {
  data_source?: "live" | "none";
  events: Array<{ id: string; action: string; actor?: string; at: string; application_id?: string }>;
}

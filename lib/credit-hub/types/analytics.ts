/** Analytics endpoints — banks-ranking, risk-distributions, auction-intel, dashboard summary. */

export interface BankRankingRow {
  lender_code: string;
  lender_display_name?: string;
  offer_count: number;
  approved_count?: number;
  declined_count?: number;
  approval_rate: number | null;
  avg_apr: number | null;
  avg_response_hours: number | null;
  /** Client-side fit score 0–100 when computed in UI */
  fit_score?: number;
}

export interface BanksRankingResponse {
  tenant_id: string;
  banks: BankRankingRow[];
  generated_at: string;
}

export interface DistributionBucket {
  band: string;
  count: number;
  pct: number;
}

export interface RejectionReasonRow {
  reason_code: string;
  reason?: string;
  count: number;
  pct: number;
}

export interface RiskDistributionsResponse {
  tenant_id: string;
  pti_distribution: DistributionBucket[];
  ltv_distribution: DistributionBucket[];
  rejection_reasons: RejectionReasonRow[];
  score_distribution?: Record<string, number>;
  generated_at: string;
}

export interface AuctionIntelSummary {
  total_applications: number;
  applications_with_offers: number;
  look_to_book: number | null;
  total_offers: number;
  win_rate: number | null;
  avg_time_to_offer_hours: number | null;
  lost_deals_count: number;
}

export interface AuctionIntelResponse extends AuctionIntelSummary {
  tenant_id: string;
  lender_breakdown?: Array<{
    lender_code: string;
    offer_count: number;
    accepted_count?: number;
    approved_count?: number;
    declined_count?: number;
    win_rate: number | null;
    avg_response_hours: number | null;
  }>;
  /** Raw payload may include winning_lender — NEVER render competitor names in bank UI */
  lost_deals?: Array<{ application_id: string; losing_lender?: string; winning_lender?: string }>;
  generated_at: string;
}

export interface DashboardSummaryPayload {
  applications_total: number;
  applications_by_status: Record<string, number>;
  applications_by_display_status: Record<string, number>;
  offers_total: number;
  offers_by_lender: Record<string, number>;
  recent_failures_24h: number;
}

export interface DashboardSummaryResponse {
  tenant_id: string;
  summary: DashboardSummaryPayload;
  generated_at: string;
}

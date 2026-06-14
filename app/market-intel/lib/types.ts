/** Market Intelligence API contract (frozen — F5b). */

export type KnownRunStatus = "draft" | "researching" | "needs_validation" | "validated";

/** Backend may emit additional status values beyond the four known gates. */
export type RunStatus = KnownRunStatus | (string & {});

export interface RunResponse {
  id: string;
  status: RunStatus;
  country_iso: string;
  vertical: string;
  product: string;
  currency: string;
  validated_by?: string;
  validated_at?: string;
  snapshot_sha256?: string;
  created_at: string;
  updated_at: string;
}

/** GET /packs — country selector; `vertical` is module id ("market_intel"), not business vertical. */
export interface MarketIntelPack {
  country_iso: string;
  name: string;
  vertical: string;
  version: string;
  status: string;
}

export interface CreateRunBody {
  country_iso: string;
  vertical: string;
  product: string;
  institution_types?: string[];
}

export interface ValidateRunBody {
  counsel_signed: boolean;
}

export interface UploadResponse {
  id: string;
  source_name: string;
  source_level: string;
  filename: string;
  uploaded_at: string;
}

export interface SourcesSummary {
  total: number;
  by_level: Record<string, number>;
  by_confidence: Record<string, number>;
}

export interface Finding {
  source_name: string;
  source_level: string;
  confidence: string;
  category: string;
  tier: string;
  validation_status: string;
  requires_counsel_review: boolean;
  summary: string;
  data_points: Array<Record<string, unknown>>;
}

export interface InstitutionShare {
  name: string;
  tier: string;
  portfolio_rd: number;
  participation_pct: number;
}

export interface MarketOverview {
  headline?: string;
  wedge_callout?: string;
  total_market_rd?: number;
  market_size_local?: number | null;
  market_size_usd?: number | null;
  growth_rate_pct?: number | null;
  key_players?: string[];
  regulatory_environment?: string | null;
  institution_shares?: InstitutionShare[];
  priority_tiers?: Array<{
    tier: string;
    label: string;
    count: number;
    description?: string;
  }>;
  [key: string]: unknown;
}

export interface PricingPlan {
  name: string;
  setup_fee?: number;
  per_application_fee?: number;
  [key: string]: unknown;
}

export interface DealerTier {
  tier: string;
  monthly_fee?: number;
  features?: string[];
  [key: string]: unknown;
}

export interface PricingProposal {
  tier?: string;
  currency?: string;
  fx_to_usd?: number;
  validation_status?: string;
  requires_counsel_review?: boolean;
  plans?: PricingPlan[];
  dealer_tiers?: DealerTier[];
  [key: string]: unknown;
}

export interface SnapshotPayload {
  sources_summary: SourcesSummary;
  findings: Finding[];
  market_overview: MarketOverview;
  entry_strategy?: Record<string, unknown>;
  pricing_proposal?: PricingProposal;
  validation_state: string;
  metadata: Record<string, unknown>;
}

/** GET /runs/{id}/snapshot — row envelope; intelligence lives in `payload`. */
export interface SnapshotRow {
  id: string;
  run_id: string;
  phase: string;
  version: string;
  payload: unknown;
  created_at: string;
}

export class MarketIntelApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public detail?: unknown
  ) {
    super(message);
    this.name = "MarketIntelApiError";
  }
}

export interface ValidateRunResult {
  run: RunResponse;
  counselRequired?: boolean;
  alreadyValidated?: boolean;
}

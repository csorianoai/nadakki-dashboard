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

export interface FindingDataPoint {
  metric: string;
  value: number;
  unit: string;
  year?: number;
}

export interface Finding {
  id?: string;
  source_name: string;
  source_level: string;
  confidence: string;
  category: string;
  tier: string;
  validation_status: string;
  requires_counsel_review: boolean;
  summary: string;
  data_points: FindingDataPoint[];
}

export interface InstitutionShare {
  name: string;
  tier: string;
  portfolio_rd: number;
  participation_pct: number;
  source?: string;
  units?: number;
}

export interface EntryStrategyInstitution {
  name: string;
  portfolio_rd: number;
  participation_pct: number;
  source?: string;
  tier?: string;
}

export interface EntryStrategyTier {
  tier: string;
  rationale: string;
  names: EntryStrategyInstitution[];
}

export interface EntryStrategy {
  target_segment: string;
  angle: string;
  sales_arguments: string[];
  institution_tiers: EntryStrategyTier[];
}

/**
 * Annual growth-rate series (%) by segment. `aggregate` is the whole auto market;
 * segment keys mirror MeeFilters["segment"] (minus "all"). Added in the DO
 * research_mock.yaml pack (backend correlative PR) and surfaced in the
 * "Tamaño y crecimiento" chart so labels reflect the active segment filter.
 */
export interface GrowthRateByYear {
  aggregate: number[];
  usados?: number[];
  nuevos?: number[];
  comercial?: number[];
}

export interface MarketOverview {
  headline?: string;
  wedge_callout?: string;
  total_market_rd?: number;
  market_size_local?: number | null;
  market_size_usd?: number | null;
  growth_rate_pct?: number | null;
  growth_rate_by_year?: GrowthRateByYear | null;
  avg_interest_rate_pct?: number | null;
  npl_ratio_pct?: number | null;
  digital_approval_rate_pct?: number | null;
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

export interface PipelineStep {
  agent: string;
  label: string;
  status: string;
  duration_s: number;
  sources?: number;
  findings?: number;
}

export interface MeeFilters {
  segment: "all" | "usados" | "nuevos" | "comercial";
  confidence: "all" | "alto" | "medio" | "bajo";
  tier: "all" | "Tier1" | "Tier2" | "Tier3";
}

export type DrawerPick =
  | { type: "institution"; data: InstitutionShare & { tier?: string } }
  | { type: "finding"; data: Finding };

export interface SnapshotViewModel extends SnapshotPayload {
  pipeline?: PipelineStep[];
}

export interface PricingPlan {
  name: string;
  setup_fee?: number;
  per_application_fee?: number;
  monthly_min?: number;
  target?: string;
  features?: string[];
  [key: string]: unknown;
}

export interface DealerTier {
  tier: string;
  label?: string;
  discount_pct?: number;
  min_apps_month?: number;
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

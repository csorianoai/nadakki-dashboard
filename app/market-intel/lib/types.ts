/** Market Intelligence API contract (frozen — F5b). */

export type RunStatus = "draft" | "researching" | "needs_validation" | "validated";

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
  institution_shares?: InstitutionShare[];
  priority_tiers?: Array<{
    tier: string;
    label: string;
    count: number;
    description?: string;
  }>;
  [key: string]: unknown;
}

export interface SnapshotPayload {
  sources_summary: SourcesSummary;
  findings: Finding[];
  market_overview: MarketOverview;
  entry_strategy?: Record<string, unknown>;
  pricing_proposal?: Record<string, unknown>;
  validation_state: string;
  metadata: Record<string, unknown>;
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

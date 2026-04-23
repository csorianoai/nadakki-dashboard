/** SpyFu / Nadakki backend shapes (Phase 1–4). Fields optional where API may vary. */

export type ConfidenceLevel = "high" | "medium" | "low";

export interface AdItem {
  date?: string;
  ad_date?: string;
  position?: number | string;
  ad_position?: number | string;
  title?: string;
  ad_title?: string;
  body?: string;
  ad_body?: string;
  description?: string;
  keywords?: string | string[];
  keyword?: string;
  url?: string;
  landing_url?: string;
  [key: string]: unknown;
}

export interface AdsResponse {
  ads?: AdItem[];
  data?: AdItem[];
  items?: AdItem[];
  [key: string]: unknown;
}

export interface KeywordItem {
  keyword?: string;
  term?: string;
  search_volume?: number;
  volume?: number;
  cpc?: number;
  difficulty?: number;
  rank?: number;
  position?: number;
  [key: string]: unknown;
}

export interface KeywordsResponse {
  paid?: KeywordItem[];
  organic?: KeywordItem[];
  paid_keywords?: KeywordItem[];
  organic_keywords?: KeywordItem[];
  data?: {
    paid?: KeywordItem[];
    organic?: KeywordItem[];
    paid_keywords?: KeywordItem[];
    organic_keywords?: KeywordItem[];
  };
  [key: string]: unknown;
}

export interface CompetitorItem {
  domain?: string;
  competitor_domain?: string;
  name?: string;
  overlap?: number;
  common_keywords?: number;
  ad_clicks?: number;
  [key: string]: unknown;
}

export interface CompetitorsResponse {
  competitors?: CompetitorItem[];
  items?: CompetitorItem[];
  data?: CompetitorItem[];
  [key: string]: unknown;
}

export interface DomainStatMonth {
  month?: string;
  year?: number;
  monthly_budget?: number;
  budget?: number;
  paid_clicks?: number;
  clicks?: number;
  strength?: number;
  rank?: number;
  [key: string]: unknown;
}

export interface DomainStatsResponse {
  domain?: string;
  stats?: DomainStatMonth[];
  monthly?: DomainStatMonth[];
  history?: DomainStatMonth[];
  summary?: Record<string, unknown>;
  current?: DomainStatMonth;
  [key: string]: unknown;
}

export interface TermAdHistoryResponse {
  ads?: AdItem[];
  items?: AdItem[];
  data?: AdItem[];
  [key: string]: unknown;
}

export interface UsageResponse {
  calls_made?: number;
  cache_hits?: number;
  rows_used?: number;
  rows_cap?: number;
  percent_used?: number;
  cost_estimate_usd?: number;
  [key: string]: unknown;
}

export interface TenantConfigResponse {
  tenant_id?: string;
  spyfu_enabled?: boolean;
  rows_cap?: number;
  [key: string]: unknown;
}

export interface IntelligenceMeta {
  cache_hit?: boolean;
  cost_estimate?: number;
  sub_calls?: number;
  fetched_at?: string;
  [key: string]: unknown;
}

export interface IntelligenceConfidence {
  overall?: ConfidenceLevel;
  notes?: string | string[];
  [key: string]: unknown;
}

export interface IntelligenceEnvelope<T> {
  data: T;
  meta?: IntelligenceMeta;
  confidence?: IntelligenceConfidence;
  [key: string]: unknown;
}

export interface CompetitorAnalysisData {
  domain_stats?: DomainStatsResponse | Record<string, unknown>;
  ppc_competitors?: CompetitorItem[];
  seo_competitors?: CompetitorItem[];
  paid_keywords?: KeywordItem[];
  organic_keywords?: KeywordItem[];
  ads?: AdItem[];
  [key: string]: unknown;
}

export interface AdHistoryData {
  ads?: AdItem[];
  items?: AdItem[];
  [key: string]: unknown;
}

export interface CompareDomainsData {
  domain_a?: Record<string, unknown>;
  domain_b?: Record<string, unknown>;
  comparison?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface KeywordIntelData {
  keyword?: string;
  stats?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface DomainSnapshotData {
  domain?: string;
  months?: DomainStatMonth[];
  [key: string]: unknown;
}

export interface ChatMeta extends IntelligenceMeta {
  [key: string]: unknown;
}

export interface ChatResponse {
  tool?: string;
  arguments?: Record<string, unknown>;
  language?: string;
  reply_markdown?: string;
  summary?: string;
  meta?: ChatMeta;
  confidence?: IntelligenceConfidence;
  raw?: unknown;
  conversation_id?: string;
  [key: string]: unknown;
}

export interface UnknownIntentExamples {
  es?: string[];
  en?: string[];
  [key: string]: unknown;
}

export class MissingTenantError extends Error {
  constructor(message = "X-Tenant-ID header required") {
    super(message);
    this.name = "MissingTenantError";
  }
}

export class TenantMismatchError extends Error {
  constructor(message = "tenant_mismatch") {
    super(message);
    this.name = "TenantMismatchError";
  }
}

export class UnknownIntentError extends Error {
  examples: UnknownIntentExamples;

  constructor(message: string, examples: UnknownIntentExamples = {}) {
    super(message);
    this.name = "UnknownIntentError";
    this.examples = examples;
  }
}

export class BudgetExceededError extends Error {
  rows_used?: number;
  rows_cap?: number;
  endpoint?: string;

  constructor(
    message: string,
    detail?: { rows_used?: number; rows_cap?: number; endpoint?: string }
  ) {
    super(message);
    this.name = "BudgetExceededError";
    if (detail) {
      this.rows_used = detail.rows_used;
      this.rows_cap = detail.rows_cap;
      this.endpoint = detail.endpoint;
    }
  }
}

export class FeatureDisabledError extends Error {
  constructor(message = "feature_disabled") {
    super(message);
    this.name = "FeatureDisabledError";
  }
}

export class NetworkError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options?.cause ? { cause: options.cause } : undefined);
    this.name = "NetworkError";
  }
}

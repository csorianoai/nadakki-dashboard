import type {
  AdItem,
  AdsResponse,
  CompetitorItem,
  CompetitorsResponse,
  DomainStatsResponse,
  KeywordItem,
  KeywordsResponse,
} from "@/types/spyfu";

export function adsListFromResponse(r: AdsResponse | null | undefined): AdItem[] {
  if (!r) return [];
  const raw = r.ads ?? r.data ?? r.items;
  return Array.isArray(raw) ? (raw as AdItem[]) : [];
}

export function keywordsSplit(r: KeywordsResponse | null | undefined): {
  paid: KeywordItem[];
  organic: KeywordItem[];
} {
  if (!r) return { paid: [], organic: [] };
  const data = r.data && typeof r.data === "object" ? r.data : null;
  const paid =
    r.paid ??
    r.paid_keywords ??
    (data && "paid" in data ? (data as KeywordsResponse).paid : undefined) ??
    (data && "paid_keywords" in data ? (data as KeywordsResponse).paid_keywords : undefined) ??
    [];
  const organic =
    r.organic ??
    r.organic_keywords ??
    (data && "organic" in data ? (data as KeywordsResponse).organic : undefined) ??
    (data && "organic_keywords" in data
      ? (data as KeywordsResponse).organic_keywords
      : undefined) ??
    [];
  return {
    paid: Array.isArray(paid) ? paid : [],
    organic: Array.isArray(organic) ? organic : [],
  };
}

export function competitorsList(r: CompetitorsResponse | null | undefined): CompetitorItem[] {
  if (!r) return [];
  const raw = r.competitors ?? r.items ?? r.data;
  return Array.isArray(raw) ? (raw as CompetitorItem[]) : [];
}

/** Pick summary fields for overview card from domain-stats-all payload. */
export function domainStatsSummary(stats: DomainStatsResponse | null | undefined): {
  monthlyBudget: number | null;
  paidClicks: number | null;
  strength: number | null;
  rank: number | null;
} {
  if (!stats) {
    return { monthlyBudget: null, paidClicks: null, strength: null, rank: null };
  }
  const cur =
    (stats.current as Record<string, unknown> | undefined) ||
    (Array.isArray(stats.stats) && stats.stats[0]
      ? (stats.stats[0] as Record<string, unknown>)
      : undefined) ||
    (Array.isArray(stats.monthly) && stats.monthly[0]
      ? (stats.monthly[0] as Record<string, unknown>)
      : undefined) ||
    (stats.summary as Record<string, unknown> | undefined) ||
    {};

  const num = (v: unknown): number | null =>
    typeof v === "number" && !Number.isNaN(v) ? v : null;

  return {
    monthlyBudget: num(cur.monthly_budget ?? cur.budget),
    paidClicks: num(cur.paid_clicks ?? cur.clicks),
    strength: num(cur.strength),
    rank: num(cur.rank),
  };
}

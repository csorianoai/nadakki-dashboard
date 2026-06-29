import { chFetch } from "./client";
import type {
  AuctionIntelResponse,
  BanksRankingResponse,
  DashboardSummaryResponse,
  DistributionBucket,
  RejectionReasonRow,
  RiskDistributionsResponse,
} from "../types/analytics";

const ANALYTICS_TIMEOUT_MS = 60_000;

function mapBuckets(raw: unknown): DistributionBucket[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const r = item as Record<string, unknown>;
    return {
      band: String(r.bucket ?? r.band ?? ""),
      count: Number(r.count ?? 0),
      pct: Number(r.percentage ?? r.pct ?? 0),
    };
  });
}

function mapRejections(raw: unknown): RejectionReasonRow[] {
  if (!Array.isArray(raw)) return [];
  const rows = raw.map((item) => {
    const r = item as Record<string, unknown>;
    return {
      reason_code: String(r.reason_code ?? r.reason ?? ""),
      reason: String(r.reason_code ?? r.reason ?? ""),
      count: Number(r.count ?? 0),
      pct: 0,
    };
  });
  const total = rows.reduce((s, x) => s + x.count, 0);
  return rows.map((r) => ({ ...r, pct: total > 0 ? (r.count / total) * 100 : 0 }));
}

export function getBanksRanking(params: { tenantId: string }): Promise<BanksRankingResponse> {
  return chFetch<BanksRankingResponse>("/api/v2/credit/analytics/banks-ranking", {
    tenantId: params.tenantId,
    actorRole: "dealer",
    timeoutMs: ANALYTICS_TIMEOUT_MS,
  });
}

export async function getRiskDistributions(params: { tenantId: string }): Promise<RiskDistributionsResponse> {
  const raw = await chFetch<Record<string, unknown>>("/api/v2/credit/analytics/risk-distributions", {
    tenantId: params.tenantId,
    actorRole: "bank_admin",
    timeoutMs: ANALYTICS_TIMEOUT_MS,
  });
  const scoreRaw = raw.score_distribution;
  const score_distribution =
    scoreRaw && typeof scoreRaw === "object" && !Array.isArray(scoreRaw)
      ? Object.fromEntries(
          Object.entries(scoreRaw as Record<string, unknown>).map(([k, v]) => [k, Number(v) || 0]),
        )
      : undefined;
  return {
    tenant_id: String(raw.tenant_id ?? ""),
    pti_distribution: mapBuckets(raw.pti_distribution),
    ltv_distribution: mapBuckets(raw.ltv_distribution),
    rejection_reasons: mapRejections(raw.rejection_reasons),
    score_distribution,
    generated_at: String(raw.generated_at ?? ""),
  };
}

export function getAuctionIntel(params: {
  tenantId: string;
  lenderCode?: string;
}): Promise<AuctionIntelResponse> {
  const q = params.lenderCode ? `?lender_code=${encodeURIComponent(params.lenderCode)}` : "";
  return chFetch<AuctionIntelResponse>(`/api/v2/credit/analytics/auction-intel${q}`, {
    tenantId: params.tenantId,
    actorRole: "bank_admin",
    timeoutMs: ANALYTICS_TIMEOUT_MS,
  });
}

/** Cap 11 dashboard summary — display_status mix + offers totals. */
export function getDashboardSummary(params: { tenantId: string }): Promise<DashboardSummaryResponse> {
  return chFetch<DashboardSummaryResponse>("/credit/dashboard/summary", {
    tenantId: params.tenantId,
    actorRole: "dealer",
    timeoutMs: ANALYTICS_TIMEOUT_MS,
  });
}

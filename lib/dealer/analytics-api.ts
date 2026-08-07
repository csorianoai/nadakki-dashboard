import {
  getBanksRanking,
  getDashboardSummary,
} from "@/lib/credit-hub/api/analyticsClient";
import type { BanksRankingResponse, DashboardSummaryResponse } from "@/lib/credit-hub/types/analytics";
import type { AnalyticsPeriod, DealerAnalytics } from "@/types/dealer-analytics";

const TENANT_STORAGE_KEY = "nadakki_tenant_id";

export function isDealerAnalyticsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_FEATURE_DEALER_ANALYTICS === "true";
}

function resolveTenantId(): string {
  if (typeof window === "undefined") {
    throw new Error("Dealer analytics requires a browser session with tenant selected.");
  }
  const fromStorage = window.localStorage.getItem(TENANT_STORAGE_KEY)?.trim();
  if (fromStorage) return fromStorage;
  const envTenant =
    process.env.NODE_ENV !== "production"
      ? process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID?.trim()
      : undefined;
  if (envTenant) return envTenant;
  throw new Error("Seleccione una institución (X-Tenant-ID).");
}

function computeDropOffs(stages: { label: string; value: number }[]): DealerAnalytics["conversionFunnel"]["dropOffPercents"] {
  const out: DealerAnalytics["conversionFunnel"]["dropOffPercents"] = [];
  for (let i = 1; i < stages.length; i++) {
    const prev = stages[i - 1]!.value;
    const curr = stages[i]!.value;
    if (prev > 0) {
      out.push({ stage: stages[i]!.label, dropOff: Number(((prev - curr) / prev).toFixed(3)) });
    }
  }
  return out;
}

function mapConversionFunnel(summary: DashboardSummaryResponse["summary"]): DealerAnalytics["conversionFunnel"] {
  const byStatus = summary.applications_by_status;
  const started = summary.applications_total;
  const submitted =
    (byStatus.SUBMITTED ?? 0) +
    (byStatus.PROCESSING ?? 0) +
    (byStatus.APPROVED ?? 0) +
    (byStatus.OFFER_SELECTED ?? 0) +
    (byStatus.READY_FOR_DISBURSEMENT ?? 0) +
    (byStatus.DISBURSED ?? 0) +
    (byStatus.COMPLETED ?? 0);
  const approved =
    (byStatus.APPROVED ?? 0) +
    (byStatus.OFFER_SELECTED ?? 0) +
    (byStatus.READY_FOR_DISBURSEMENT ?? 0);
  const closed =
    (byStatus.DISBURSED ?? 0) +
    (byStatus.COMPLETED ?? 0) +
    (byStatus.OFFER_SELECTED ?? 0);

  const stages = [
    { label: "Submitted", value: submitted },
    { label: "Approved", value: approved },
    { label: "Closed", value: closed },
  ];

  return {
    started,
    submitted,
    approved,
    closed,
    dropOffPercents: computeDropOffs([{ label: "Started", value: started }, ...stages]),
  };
}

function mapTimeToClose(ranking: BanksRankingResponse): DealerAnalytics["timeToClose"] {
  const banksWithHours = ranking.banks.filter((b) => b.avg_response_hours != null);
  const weeklyAverages = ranking.banks.slice(0, 8).map((bank, index) => ({
    week: bank.lender_code || `B${index + 1}`,
    avgDays:
      bank.avg_response_hours != null ? Number((bank.avg_response_hours / 24).toFixed(1)) : 0,
  }));

  const currentAvg =
    banksWithHours.length > 0
      ? Number(
          (
            banksWithHours.reduce((sum, b) => sum + (b.avg_response_hours ?? 0), 0) /
            banksWithHours.length /
            24
          ).toFixed(1),
        )
      : 0;

  return {
    weeklyAverages,
    currentAvg,
    trend: "stable",
  };
}

function mapApprovalBuckets(ranking: BanksRankingResponse): DealerAnalytics["approvalRateByBucket"] {
  const byLender = ranking.banks.map((bank) => ({
    range: bank.lender_display_name ?? bank.lender_code,
    rate:
      bank.approval_rate != null ? Number((bank.approval_rate * 100).toFixed(1)) : 0,
    count: bank.offer_count,
  }));

  return {
    byAmount: byLender,
    byTerm: [],
    byRiskTier: [],
  };
}

function mapPerformanceMetrics(
  ranking: BanksRankingResponse,
  summary: DashboardSummaryResponse["summary"],
): DealerAnalytics["performanceMetrics"] {
  const totalOffers = ranking.banks.reduce((sum, bank) => sum + bank.offer_count, 0);
  const weightedApproval =
    totalOffers > 0
      ? ranking.banks.reduce(
          (sum, bank) => sum + (bank.approval_rate ?? 0) * bank.offer_count,
          0,
        ) / totalOffers
      : 0;

  const aprValues = ranking.banks
    .map((bank) => bank.avg_apr)
    .filter((v): v is number => v != null && !Number.isNaN(v));
  const avgDealSize =
    aprValues.length > 0
      ? Number((aprValues.reduce((a, b) => a + b, 0) / aprValues.length).toFixed(0))
      : 0;

  return {
    avgDealSize,
    totalVolume: summary.offers_total,
    approvalRate: Number((weightedApproval * 100).toFixed(2)),
    npsScore: 0,
  };
}

function mapDealerAnalytics(
  ranking: BanksRankingResponse,
  dashboard: DashboardSummaryResponse,
): DealerAnalytics {
  return {
    conversionFunnel: mapConversionFunnel(dashboard.summary),
    timeToClose: mapTimeToClose(ranking),
    approvalRateByBucket: mapApprovalBuckets(ranking),
    performanceMetrics: mapPerformanceMetrics(ranking, dashboard.summary),
  };
}

function dealerAnalyticsToCsv(data: DealerAnalytics, period: AnalyticsPeriod): string {
  const lines = [
    "section,key,value",
    `meta,period,${period}`,
    `funnel,started,${data.conversionFunnel.started}`,
    `funnel,submitted,${data.conversionFunnel.submitted}`,
    `funnel,approved,${data.conversionFunnel.approved}`,
    `funnel,closed,${data.conversionFunnel.closed}`,
    `performance,avgDealSize,${data.performanceMetrics.avgDealSize}`,
    `performance,totalVolume,${data.performanceMetrics.totalVolume}`,
    `performance,approvalRate,${data.performanceMetrics.approvalRate}`,
    `performance,npsScore,${data.performanceMetrics.npsScore}`,
    `timeToClose,currentAvgDays,${data.timeToClose.currentAvg}`,
    `timeToClose,trend,${data.timeToClose.trend}`,
  ];

  for (const row of data.approvalRateByBucket.byAmount) {
    lines.push(`lender,${row.range.replace(/,/g, " ")},rate=${row.rate};count=${row.count}`);
  }

  return `${lines.join("\n")}\n`;
}

/** Period is retained for UI compatibility; credit analytics endpoints are tenant-scoped snapshots. */
export async function getDealerAnalytics(period: AnalyticsPeriod = "30d"): Promise<DealerAnalytics> {
  const tenantId = resolveTenantId();

  try {
    const [ranking, dashboard] = await Promise.all([
      getBanksRanking({ tenantId }),
      getDashboardSummary({ tenantId }),
    ]);
    return mapDealerAnalytics(ranking, dashboard);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Analytics fetch failed: ${message}`);
  }
}

/** No backend export route — CSV is synthesized client-side from mapped analytics. */
export async function exportAnalyticsCSV(period: AnalyticsPeriod): Promise<Blob> {
  const data = await getDealerAnalytics(period);
  return new Blob([dealerAnalyticsToCsv(data, period)], { type: "text/csv;charset=utf-8" });
}

export function downloadExportedBlob(blob: Blob, filename: string): void {
  if (typeof document === "undefined") return;
  const canBlob =
    typeof URL !== "undefined" &&
    typeof URL.createObjectURL === "function" &&
    typeof URL.revokeObjectURL === "function";
  const url = canBlob ? URL.createObjectURL(blob) : "";
  if (!url) return;
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  if (canBlob) URL.revokeObjectURL(url);
}

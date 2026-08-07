import {
  getAuctionIntel,
  getDashboardSummary,
  getRiskDistributions,
} from "@/lib/credit-hub/api/analyticsClient";
import type {
  AuctionIntelResponse,
  DashboardSummaryResponse,
  RiskDistributionsResponse,
} from "@/lib/credit-hub/types/analytics";
import type { BankAnalytics, BankAnalyticsPeriod } from "@/types/bank-analytics";

export type BankAnalyticsXRoleHeader = "BANK_ANALYST" | "BANK_ADMIN";

const TENANT_STORAGE_KEY = "nadakki_tenant_id";

export function isBankAnalyticsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_FEATURE_BANK_ANALYTICS === "true";
}

/** Header value required by Phase C Agent-4 spec (distinct from TENANT_ADMIN used elsewhere). */
export function resolveBankAnalyticsRoleFromBrowser(): BankAnalyticsXRoleHeader | null {
  if (typeof window === "undefined") return null;

  const envRole = process.env.NEXT_PUBLIC_DEV_BANK_ROLE?.trim().toUpperCase();
  if (envRole === "BANK_ANALYST" || envRole === "BANK_ADMIN") {
    return envRole;
  }

  const raw = (window.localStorage.getItem("nadakki_role") ?? "").trim().toLowerCase();
  if (!raw.length) return "BANK_ANALYST";
  if (raw.includes("dealer")) return null;
  if (
    raw === "admin" ||
    raw === "owner" ||
    raw === "tenant_admin" ||
    raw === "system_admin" ||
    raw.includes("bank_admin")
  ) {
    return "BANK_ADMIN";
  }
  if (raw.includes("tenant")) return "BANK_ADMIN";
  if (raw === "viewer" || raw === "bank_analyst" || raw === "analyst" || raw === "risk") {
    return "BANK_ANALYST";
  }
  return "BANK_ANALYST";
}

export function canAccessBankAnalytics(): boolean {
  return resolveBankAnalyticsRoleFromBrowser() !== null;
}

/** Always mask aggregates shown in analyst-facing dashboards (Phase C RBAC UX). */
export function maskBankAnalyticsText(text: string | undefined): string {
  const s = text?.trim() ?? "";
  if (!s) return "—";
  return (
    s
      .replace(/\b\d{3}-\d{7}-\d{1}\b/g, "***-*******-*")
      .replace(/\b\d{11}\b/g, "***********")
      .replace(/\b\d{10,}\b/g, "******")
      .replace(/\b[\w.%+-]+@[\w.-]+\.[a-z]{2,}\b/gi, "***@masked")
      .replace(/\b(?:\+\d{1,3}[ .-]?)?(?:\(?\d{3}\)?[ .-]?\d{3}[ .-]?\d{4})\b/g, "*** *** ****")
      .replace(/\bCliente\s+[A-Za-zÁÉÍÓÚÑáéíóúñ]+(?:\s+[A-Za-zÁÉÍÓÚÑáéíóúñ]+){0,4}\b/gi, "Cliente ***")
      .trim()
  );
}

function resolveTenantId(): string {
  if (typeof window === "undefined") {
    throw new Error("Bank analytics requires a browser session with tenant selected.");
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

function mapDecisionDistribution(
  byStatus: Record<string, number>,
): BankAnalytics["decisionDistribution"] {
  let approved = 0;
  let declined = 0;
  let pending = 0;
  let withdrawn = 0;

  for (const [status, count] of Object.entries(byStatus)) {
    const key = status.toUpperCase();
    if (["APPROVED", "OFFER_SELECTED", "READY_FOR_DISBURSEMENT", "DISBURSED", "COMPLETED"].includes(key)) {
      approved += count;
    } else if (["REJECTED", "DECLINED"].includes(key)) {
      declined += count;
    } else if (["EXPIRED", "WITHDRAWN", "FAILED", "CANCELLED"].includes(key)) {
      withdrawn += count;
    } else {
      pending += count;
    }
  }

  return { approved, declined, pending, withdrawn };
}

function mapRiskHeatmap(risk: RiskDistributionsResponse): BankAnalytics["riskHeatmap"]["cells"] {
  const cells: BankAnalytics["riskHeatmap"]["cells"] = [];

  if (risk.ltv_distribution.length && risk.pti_distribution.length) {
    for (const ltv of risk.ltv_distribution) {
      for (const pti of risk.pti_distribution) {
        cells.push({
          amountBucket: ltv.band,
          riskBucket: pti.band,
          volume: Math.max(ltv.count, pti.count),
          color: "",
        });
      }
    }
    return cells;
  }

  for (const ltv of risk.ltv_distribution) {
    cells.push({
      amountBucket: ltv.band,
      riskBucket: "50–70",
      volume: ltv.count,
      color: "",
    });
  }
  for (const pti of risk.pti_distribution) {
    cells.push({
      amountBucket: "100k–250k",
      riskBucket: pti.band,
      volume: pti.count,
      color: "",
    });
  }
  return cells;
}

function mapPortfolioOverview(
  dashboard: DashboardSummaryResponse,
  auction: AuctionIntelResponse,
  risk: RiskDistributionsResponse,
): BankAnalytics["portfolioOverview"] {
  const summary = dashboard.summary;
  const terminal = mapDecisionDistribution(summary.applications_by_status);
  const activeApplications = Math.max(
    0,
    summary.applications_total - terminal.approved - terminal.declined - terminal.withdrawn,
  );

  const rejectionTotal = risk.rejection_reasons.reduce((sum, row) => sum + row.count, 0);
  const stipulationsFrequency =
    rejectionTotal > 0 && summary.applications_total > 0
      ? (rejectionTotal / summary.applications_total) * 100
      : 0;

  const approvalFromAuction =
    auction.win_rate != null ? Number((auction.win_rate * 100).toFixed(1)) : null;
  const approvalFromDecisions =
    terminal.approved + terminal.declined > 0
      ? (terminal.approved / (terminal.approved + terminal.declined)) * 100
      : 0;

  return {
    totalOffers: summary.offers_total,
    activeApplications,
    approvalRate: approvalFromAuction ?? Number(approvalFromDecisions.toFixed(1)),
    stipulationsFrequency: Number(stipulationsFrequency.toFixed(1)),
  };
}

function mapStipulations(
  risk: RiskDistributionsResponse,
): BankAnalytics["stipulationsFrequency"] {
  return {
    topStipulations: risk.rejection_reasons.map((row) => ({
      name: row.reason_code || row.reason || "UNKNOWN",
      count: row.count,
      percent: Number(row.pct.toFixed(1)),
    })),
  };
}

function mapBankAnalytics(
  risk: RiskDistributionsResponse,
  auction: AuctionIntelResponse,
  dashboard: DashboardSummaryResponse,
): BankAnalytics {
  return {
    portfolioOverview: mapPortfolioOverview(dashboard, auction, risk),
    riskHeatmap: { cells: mapRiskHeatmap(risk) },
    decisionDistribution: mapDecisionDistribution(dashboard.summary.applications_by_status),
    stipulationsFrequency: mapStipulations(risk),
    anomalies: [],
  };
}

/** Period is retained for UI compatibility; credit analytics endpoints are tenant-scoped snapshots. */
export async function getBankAnalytics(_period: BankAnalyticsPeriod): Promise<BankAnalytics> {
  const role = typeof window !== "undefined" ? resolveBankAnalyticsRoleFromBrowser() : null;
  if (!role) throw new Error("Acceso solo para roles bancarios BANK_ANALYST / BANK_ADMIN.");

  const tenantId = resolveTenantId();

  try {
    const [risk, auction, dashboard] = await Promise.all([
      getRiskDistributions({ tenantId }),
      getAuctionIntel({ tenantId }),
      getDashboardSummary({ tenantId }),
    ]);
    return mapBankAnalytics(risk, auction, dashboard);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Bank analytics fetch failed: ${message}`);
  }
}

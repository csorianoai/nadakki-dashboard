import { PlatformApiError, platformFetch } from "@/lib/platformApi";
import { normalizeTenantOverview } from "@/lib/cockpit/finance-v3/normalize/tenant";
import type { TenantConsolidatedEnvelope } from "@/lib/cockpit/finance-v3/contracts/tenant";
import type { TenantFinancialRow } from "@/lib/cockpit/finance-v3/contracts/finance";

export type TenantOverviewFetchResult =
  | { status: "ok"; envelope: TenantConsolidatedEnvelope }
  | { status: "not_found" }
  | { status: "error"; error: string; statusCode?: number };

export async function fetchTenantOverview(tenantRef: string): Promise<TenantOverviewFetchResult> {
  try {
    const raw = await platformFetch<unknown>(
      `/api/v1/cockpit/finance/tenants/${encodeURIComponent(tenantRef)}/overview`,
    );
    return { status: "ok", envelope: normalizeTenantOverview(raw) };
  } catch (err) {
    if (err instanceof PlatformApiError) {
      if (err.status === 404) return { status: "not_found" };
      return { status: "error", error: err.message, statusCode: err.status };
    }
    return { status: "error", error: err instanceof Error ? err.message : "Error de red" };
  }
}

/** Reconcile tenant detail finance block vs Revenue F2 tenant row (H6). */
export function reconcileTenantFinanceWithRevenue(
  overview: TenantConsolidatedEnvelope,
  revenueRow: TenantFinancialRow | null | undefined,
): { ok: boolean; warnings: { code: string; severity: string; message: string }[] } {
  const warnings: { code: string; severity: string; message: string }[] = [];
  if (!revenueRow) return { ok: true, warnings };

  const detailMrr = overview.data.finance.mrr_contribution;
  const revenueMrr = revenueRow.mrr_contribution;
  if (Math.abs(detailMrr - revenueMrr) > 0.01) {
    warnings.push({
      code: "RECONCILIATION_MISMATCH",
      severity: "error",
      message: `MRR tenant: detalle=${detailMrr} vs ingresos=${revenueMrr}`,
    });
  }
  return { ok: warnings.length === 0, warnings };
}

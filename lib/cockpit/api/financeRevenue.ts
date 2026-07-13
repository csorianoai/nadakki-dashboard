import { fetchOrDemo } from "./fetchOrDemo";
import { fetchTenants } from "./tenantAdmin";
import { demoFinanceKpis, demoMrrByCore, demoTenantFinancialsList } from "../demo-finance";
import type {
  FinanceKpisResponse,
  MrrByCoreResponse,
  TenantFinancialsListResponse,
  TenantFinancialsResponse,
} from "../types-finance";

export function fetchFinanceKpis() {
  return fetchOrDemo<FinanceKpisResponse>("/api/v1/cockpit/finance/kpis", demoFinanceKpis);
}

export function fetchMrrByCore() {
  return fetchOrDemo<MrrByCoreResponse>("/api/v1/cockpit/finance/mrr/by-core", demoMrrByCore);
}

export function fetchTenantFinancials(tenantId: string) {
  return fetchOrDemo<TenantFinancialsResponse>(
    `/api/v1/cockpit/finance/tenants/${encodeURIComponent(tenantId)}/financials`,
    () => ({
      data_source: "demo",
      tenant_id: tenantId,
      financials: demoTenantFinancialsList(1, 1).items[0] ?? {
        tenant_id: tenantId,
        tenant_name: "—",
        mrr_contribution: 0,
        subscription_status: "unknown",
      },
    }),
  );
}

/** Aggregate tenant list + per-tenant financials; falls back to demo list on 404. */
export async function fetchTenantsFinancialsPage(
  page = 1,
  pageSize = 20,
): Promise<{ data: TenantFinancialsListResponse; isDemo: boolean; error: string | null }> {
  try {
    const tenantsRes = await fetchTenants();
    if (tenantsRes.isDemo || tenantsRes.tenants.length === 0) {
      const demo = demoTenantFinancialsList(page, pageSize);
      return { data: demo, isDemo: true, error: null };
    }
    const slice = tenantsRes.tenants.slice((page - 1) * pageSize, page * pageSize);
    const rows = await Promise.all(
      slice.map(async (t) => {
        const fin = await fetchTenantFinancials(t.id);
        return (
          fin.data.financials ?? {
            tenant_id: t.id,
            tenant_name: t.name,
            plan_name: t.plan_name,
            mrr_contribution: 0,
            subscription_status: t.status,
          }
        );
      }),
    );
    return {
      data: {
        data_source: "live",
        items: rows,
        total: tenantsRes.tenants.length,
        page,
        page_size: pageSize,
      },
      isDemo: tenantsRes.isDemo,
      error: null,
    };
  } catch {
    const demo = demoTenantFinancialsList(page, pageSize);
    return { data: demo, isDemo: true, error: null };
  }
}

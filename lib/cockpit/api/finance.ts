import { fetchOrDemo, fetchOrNone } from "@/lib/cockpit/api/fetchOrDemo";
import {
  demoFinanceKpisRaw,
  demoMrrByCoreRaw,
  noneTenantFinancialsListRaw,
} from "@/lib/cockpit/demo-finance";
import {
  normalizeFinanceKpis,
  normalizeMrrByCore,
  normalizeTenantFinancialsList,
} from "@/lib/cockpit/finance-v3/normalize/finance";
import type {
  FinanceKpisEnvelope,
  MrrByCoreEnvelope,
  TenantFinancialsListEnvelope,
} from "@/lib/cockpit/finance-v3/contracts/finance";

export type FinancePanelResult<T> = {
  envelope: T;
  isDemo: boolean;
  isAbsent?: boolean;
  error: string | null;
};

export async function fetchFinanceKpisPanel(): Promise<FinancePanelResult<FinanceKpisEnvelope>> {
  const { data, isDemo, error } = await fetchOrDemo(
    "/api/v1/cockpit/finance/kpis",
    demoFinanceKpisRaw,
  );
  return { envelope: normalizeFinanceKpis(data), isDemo, error };
}

export async function fetchMrrByCorePanel(): Promise<FinancePanelResult<MrrByCoreEnvelope>> {
  const { data, isDemo, error } = await fetchOrDemo(
    "/api/v1/cockpit/finance/mrr/by-core",
    demoMrrByCoreRaw,
  );
  return { envelope: normalizeMrrByCore(data), isDemo, error };
}

export async function fetchTenantFinancialsPanel(
  params?: { limit?: number; cursor?: string },
): Promise<FinancePanelResult<TenantFinancialsListEnvelope>> {
  const q = new URLSearchParams();
  if (params?.limit) q.set("limit", String(params.limit));
  if (params?.cursor) q.set("cursor", params.cursor);
  const suffix = q.size ? `?${q.toString()}` : "";
  const { data, isAbsent, error } = await fetchOrNone(
    `/api/v1/cockpit/finance/tenants/financials${suffix}`,
    noneTenantFinancialsListRaw,
  );
  return {
    envelope: normalizeTenantFinancialsList(data),
    isDemo: false,
    isAbsent,
    error,
  };
}

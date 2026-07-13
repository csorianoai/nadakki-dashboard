import {
  CORE_COLOR_FALLBACK,
  CORE_DISPLAY_FALLBACK,
  PLATFORM_CORE_ORDER,
  type PlatformCoreCode,
} from "./core-registry";
import type {
  FinanceKpisResponse,
  MrrByCoreResponse,
  TenantFinancialRow,
  TenantFinancialsListResponse,
} from "./types-finance";

export function demoFinanceKpis(): FinanceKpisResponse {
  return {
    data_source: "demo",
    total_mrr: 45000,
    arr_projected: 540000,
    active_subscriptions: 8,
    tenants_managed: 8,
    tenants_unmanaged: 0,
  };
}

export function demoMrrByCore(): MrrByCoreResponse {
  const weights = [0.35, 0.2, 0.15, 0.12, 0.1, 0.08];
  const total = 45000;
  return {
    data_source: "demo",
    cores: PLATFORM_CORE_ORDER.map((code, i) => ({
      core_code: code,
      display_name: CORE_DISPLAY_FALLBACK[code as PlatformCoreCode],
      mrr: Math.round(total * weights[i]),
      tenant_count: 3 + (i % 4),
      color_hex: CORE_COLOR_FALLBACK[code as PlatformCoreCode],
    })),
  };
}

function demoTenantRow(i: number): TenantFinancialRow {
  return {
    tenant_id: `00000000-0000-4000-8000-0000000000${String(i).padStart(2, "0")}`,
    tenant_name: `Institución ${String(i).padStart(2, "0")}`,
    plan_name: i % 3 === 0 ? "Enterprise" : i % 2 === 0 ? "Profesional" : "Básico",
    mrr_contribution: 3500 + i * 420,
    subscription_status: i === 7 ? "suspended" : "active",
    current_period_end: new Date(Date.now() + 20 * 86400000).toISOString(),
    next_renewal_at: new Date(Date.now() + 20 * 86400000).toISOString(),
  };
}

export function demoTenantFinancialsList(page = 1, pageSize = 20): TenantFinancialsListResponse {
  const all = Array.from({ length: 8 }, (_, i) => demoTenantRow(i + 1));
  const start = (page - 1) * pageSize;
  return {
    data_source: "demo",
    items: all.slice(start, start + pageSize),
    total: all.length,
    page,
    page_size: pageSize,
  };
}

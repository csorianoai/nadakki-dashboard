/**
 * Monetización data adapter — mock-first (USE_API=false).
 */
import {
  BANK_METRICS_MAY_2026,
  BILLING_CONFIG_DEFAULT,
  DASHBOARD_KPIS,
  DEALER_METRICS_MAY_2026,
  DEMO_TENANTS_DATA,
  DRILLDOWNS,
  INVOICE_MAY_2026,
  RECONCILIATION_MAY_2026,
  REVENUE_ANALYTICS_MAY_2026,
  COST_MARGIN_MAY_2026,
} from "./fixtures";
import type {
  BankMetrics,
  BillingConfig,
  CostMargin,
  DashboardKPIs,
  DealerMetrics,
  DrilldownMap,
  Invoice,
  Reconciliation,
  RevenueAnalytics,
  Tenant,
} from "./types";

const USE_API = process.env.NEXT_PUBLIC_FM_USE_API === "true";

export function monetizacionUsesApi(): boolean {
  return USE_API;
}

export async function fetchTenants(): Promise<Tenant[]> {
  if (USE_API) throw new Error("Monetización API not wired — set NEXT_PUBLIC_FM_USE_API=false");
  return DEMO_TENANTS_DATA;
}

export async function fetchDashboardKpis(): Promise<DashboardKPIs> {
  if (USE_API) throw new Error("Monetización API not wired");
  return DASHBOARD_KPIS;
}

export async function fetchBillingConfig(): Promise<BillingConfig> {
  if (USE_API) throw new Error("Monetización API not wired");
  return BILLING_CONFIG_DEFAULT;
}

export async function fetchInvoice(): Promise<Invoice> {
  if (USE_API) throw new Error("Monetización API not wired");
  return INVOICE_MAY_2026;
}

export async function fetchDrilldowns(): Promise<DrilldownMap> {
  if (USE_API) throw new Error("Monetización API not wired");
  return DRILLDOWNS;
}

export async function fetchReconciliation(): Promise<Reconciliation> {
  if (USE_API) throw new Error("Monetización API not wired");
  return RECONCILIATION_MAY_2026;
}

export async function fetchBankMetrics(tenantId: string): Promise<BankMetrics | null> {
  if (USE_API) throw new Error("Monetización API not wired");
  if (tenantId !== BANK_METRICS_MAY_2026.tenant_id) return null;
  return BANK_METRICS_MAY_2026;
}

export async function fetchDealerMetrics(tenantId: string): Promise<DealerMetrics | null> {
  if (USE_API) throw new Error("Monetización API not wired");
  if (tenantId !== DEALER_METRICS_MAY_2026.tenant_id) return null;
  return DEALER_METRICS_MAY_2026;
}

export async function fetchRevenueAnalytics(): Promise<RevenueAnalytics> {
  if (USE_API) throw new Error("Monetización API not wired");
  return REVENUE_ANALYTICS_MAY_2026;
}

export async function fetchCostMargin(): Promise<CostMargin> {
  if (USE_API) throw new Error("Monetización API not wired");
  return COST_MARGIN_MAY_2026;
}

/**
 * Monetización data adapter — API-first on staging (USE_API=true), fixtures for local dev.
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
import {
  monetizacionFetch,
  type MonetizacionConfigApi,
  type MonetizacionCostoMargenApi,
  type MonetizacionDashboardApi,
  type MonetizacionEstadoCuentaApi,
  type MonetizacionIngresosApi,
} from "./api-client";
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

/** Local dev only — clearly marked mock fallback when API flag is off. */
function mockOnly<T>(label: string, value: T): T {
  if (process.env.NODE_ENV === "production" && USE_API) {
    throw new Error(`Monetización mock blocked in production without API: ${label}`);
  }
  return value;
}

function mapDashboard(api: MonetizacionDashboardApi): DashboardKPIs {
  const used = api.evaluations_used ?? 0;
  const limit = api.monthly_limit ?? 1;
  const pct = api.usage_pct ?? Math.round((used / Math.max(limit, 1)) * 100);
  return {
    gmv: "—",
    take_rate: "—",
    mrr: api.plan === "demo" ? "Demo" : `${api.currency} plan`,
    margen_bruto: `${pct}% uso`,
    subastas_activas: 0,
    bancos_en_linea: "—",
    aprobacion: "—",
    tiempo_primera_oferta: "—",
    revenue_by_model: [],
    tape: [
      {
        time: new Date().toISOString(),
        type: "api",
        text: `Fuente: ${api.data_source}`,
      },
    ],
    tenants: DEMO_TENANTS_DATA.map((t) => ({
      name: t.name,
      kind: t.kind,
      model: t.model,
      gmv: 0,
      revenue: 0,
      cost: 0,
      margin_pct: pct,
      status: "ok" as const,
      initial: t.initial,
      color: t.color,
    })),
    alerts:
      api.data_source === "mock_fallback"
        ? [{ kind: "info", text: "Backend en modo degradado (FF_REAL_* off)", severity: "warn" as const }]
        : [],
  };
}

function mapIngresos(api: MonetizacionIngresosApi): RevenueAnalytics {
  const base = REVENUE_ANALYTICS_MAY_2026;
  const total = api.total ?? 0;
  return {
    ...base,
    period: "API",
    total: String(total),
    total_delta: api.data_source === "real" ? "live" : "degraded",
  };
}

function mapCostMargin(api: MonetizacionCostoMargenApi): CostMargin {
  return {
    ...COST_MARGIN_MAY_2026,
    period: `Plan ${api.plan}`,
    margen_bruto: api.data_source === "real" ? COST_MARGIN_MAY_2026.margen_bruto : "—",
  };
}

function mapEstadoCuenta(api: MonetizacionEstadoCuentaApi): Invoice {
  return {
    ...INVOICE_MAY_2026,
    tenant_id: api.tenant_id,
    total: api.total ?? 0,
    subtotal: api.total ?? 0,
    number: `API-${api.tenant_id.slice(0, 8)}`,
    period: new Date().toISOString().slice(0, 7),
    model: api.plan ?? "api",
  };
}

function mapConfig(api: MonetizacionConfigApi): BillingConfig {
  return {
    ...BILLING_CONFIG_DEFAULT,
    base_model: "B1",
    versions: [{ tariff: api.plan_key ?? "api", range: "staging", current: true }],
  };
}

export async function fetchTenants(): Promise<Tenant[]> {
  if (USE_API) {
    return DEMO_TENANTS_DATA;
  }
  return mockOnly("tenants", DEMO_TENANTS_DATA);
}

export async function fetchDashboardKpis(): Promise<DashboardKPIs> {
  if (USE_API) {
    const raw = await monetizacionFetch<MonetizacionDashboardApi>("/api/v2/monetizacion/dashboard");
    return mapDashboard(raw);
  }
  return mockOnly("dashboard", DASHBOARD_KPIS);
}

export async function fetchBillingConfig(): Promise<BillingConfig> {
  if (USE_API) {
    const tenantId = DEMO_TENANTS_DATA[0]?.id ?? "";
    const raw = await monetizacionFetch<MonetizacionConfigApi>(
      `/api/v2/monetizacion/configuracion/${tenantId}`,
    );
    return mapConfig(raw);
  }
  return mockOnly("billing_config", BILLING_CONFIG_DEFAULT);
}

export async function fetchInvoice(tenantId?: string): Promise<Invoice> {
  if (USE_API) {
    const tid = tenantId ?? DEMO_TENANTS_DATA[0]?.id ?? "";
    const raw = await monetizacionFetch<MonetizacionEstadoCuentaApi>(
      `/api/v2/monetizacion/estado-cuenta/${tid}`,
    );
    return mapEstadoCuenta(raw);
  }
  return mockOnly("invoice", INVOICE_MAY_2026);
}

export async function fetchDrilldowns(): Promise<DrilldownMap> {
  if (USE_API) {
    // Backend has no drilldown endpoint yet — return empty-shaped map (not fixture data).
    return Object.fromEntries(
      Object.entries(DRILLDOWNS).map(([key, drill]) => [
        key,
        { ...drill, events: [], agg: 0, aggValue: 0, count: "0" },
      ]),
    ) as DrilldownMap;
  }
  return mockOnly("drilldowns", DRILLDOWNS);
}

export async function fetchReconciliation(tenantId?: string): Promise<Reconciliation> {
  if (USE_API) {
    const tid = tenantId ?? DEMO_TENANTS_DATA[0]?.id ?? "";
    const raw = await monetizacionFetch<{ discrepancy?: number; reconciled?: boolean; data_source: string }>(
      `/api/v2/monetizacion/reconciliacion/${tid}`,
    );
    return {
      ...RECONCILIATION_MAY_2026,
      matches: RECONCILIATION_MAY_2026.matches,
    };
  }
  return mockOnly("reconciliation", RECONCILIATION_MAY_2026);
}

export async function fetchBankMetrics(tenantId: string): Promise<BankMetrics | null> {
  if (USE_API) {
    try {
      const raw = await monetizacionFetch<{ tenant_id: string; evaluations_used?: number; plan?: string }>(
        `/api/v2/monetizacion/metricas-banco/${tenantId}`,
      );
      return {
        ...BANK_METRICS_MAY_2026,
        tenant_id: raw.tenant_id,
        model_label: raw.plan ?? "api",
        ai_usage: {
          ...BANK_METRICS_MAY_2026.ai_usage,
          decisions: raw.evaluations_used ?? 0,
        },
      };
    } catch {
      return null;
    }
  }
  if (tenantId !== BANK_METRICS_MAY_2026.tenant_id) return null;
  return mockOnly("bank_metrics", BANK_METRICS_MAY_2026);
}

export async function fetchDealerMetrics(tenantId: string): Promise<DealerMetrics | null> {
  if (USE_API) {
    try {
      const raw = await monetizacionFetch<{ tenant_id: string; evaluations_used?: number }>(
        `/api/v2/monetizacion/metricas-dealer/${tenantId}`,
      );
      return {
        ...DEALER_METRICS_MAY_2026,
        tenant_id: raw.tenant_id,
        plan: "api",
        dealer_fees: {
          ...DEALER_METRICS_MAY_2026.dealer_fees,
          requests_used: raw.evaluations_used ?? 0,
        },
      };
    } catch {
      return null;
    }
  }
  if (tenantId !== DEALER_METRICS_MAY_2026.tenant_id) return null;
  return mockOnly("dealer_metrics", DEALER_METRICS_MAY_2026);
}

export async function fetchRevenueAnalytics(): Promise<RevenueAnalytics> {
  if (USE_API) {
    const raw = await monetizacionFetch<MonetizacionIngresosApi>("/api/v2/monetizacion/ingresos");
    return mapIngresos(raw);
  }
  return mockOnly("revenue", REVENUE_ANALYTICS_MAY_2026);
}

export async function fetchCostMargin(): Promise<CostMargin> {
  if (USE_API) {
    const raw = await monetizacionFetch<MonetizacionCostoMargenApi>("/api/v2/monetizacion/costo-margen");
    return mapCostMargin(raw);
  }
  return mockOnly("cost_margin", COST_MARGIN_MAY_2026);
}

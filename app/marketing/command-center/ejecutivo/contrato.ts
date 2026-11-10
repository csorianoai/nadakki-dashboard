/**
 * Contrato del backend para el Command Center real: GET /api/v1/marketing/insights/summary (nadakki-ai-suite, CORE-MARKETING).
 * Lo consume `adaptador-real.ts`; aqui solo estan los tipos. NO se inventa ningun campo: lo que el backend no da queda en su estado
 * "pendiente" (leads de CRM, supuestos B2-T1, semaforo B2-T2, decisiones).
 */
export type EstadoKpi = "ok" | "datos_insuficientes" | "sin_datos";

export interface KpiInsights {
  value: number | null;
  previous: number | null;
  delta_pct: number | null;
  status: EstadoKpi;
}

export interface PeriodoInsights {
  from: string;
  to: string;
  days: number;
}

export interface CuentaInsights {
  customer_id: string;
  /** Enmascarada para mostrar (p. ej. 822***139). */
  label: string;
  currency: string | null;
}

export interface PuntoDiario {
  date: string;
  spend: number | null;
  clicks: number | null;
  conversions: number | null;
}

export interface CampanaInsights {
  campaign_id: string;
  name: string;
  status: string | null;
  spend: number | null;
  clicks: number | null;
  conversions: number | null;
  cpa: number | null;
}

export const METRICAS_INSIGHTS = ["spend", "impressions", "clicks", "ctr", "avg_cpc", "conversions", "conversion_value", "cpa", "roas"] as const;
export type MetricaInsights = (typeof METRICAS_INSIGHTS)[number];

export interface ResumenInsights {
  period: PeriodoInsights;
  previous_period: PeriodoInsights | null;
  /** Instante (ISO) del ultimo sync. null = sin datos. */
  as_of: string | null;
  last_days_may_change: number;
  /** Moneda de la CUENTA de Google Ads (leida de la API). confirmed=false o code null => "moneda no confirmada". */
  currency: { code: string | null; source: "google_ads_api" | null; confirmed: boolean };
  accounts: CuentaInsights[];
  requires_account_selection: boolean;
  kpis: Partial<Record<MetricaInsights, KpiInsights>> | null;
  series: PuntoDiario[] | null;
  previous_series: PuntoDiario[] | null;
  campaigns: CampanaInsights[] | null;
  coverage: { days_in_period: number; days_with_data: number; tables_present: boolean };
  economics: { status: string };
}

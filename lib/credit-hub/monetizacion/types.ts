/** HANDOFF §7 — Monetización data contract (mock-first). */

export type TenantKind = "banco" | "dealer" | "operador";

export type BaseModel = "B1" | "B2" | "B3" | "B4";

export interface Tenant {
  id: string;
  name: string;
  kind: TenantKind;
  model: string;
  color: string;
  initial: string;
}

export interface DashboardKPIs {
  gmv: string;
  take_rate: string;
  mrr: string;
  margen_bruto: string;
  subastas_activas: number;
  bancos_en_linea: string;
  aprobacion: string;
  tiempo_primera_oferta: string;
  revenue_by_model: RevenueSlice[];
  tape: TapeEvent[];
  tenants: TenantRowData[];
  alerts: AlertData[];
}

export interface RevenueSlice {
  label: string;
  amount: number;
  pct: number;
  color: string;
}

export interface TapeEvent {
  time: string;
  type: string;
  text: string;
  amount?: string;
}

export interface TenantRowData {
  name: string;
  kind: TenantKind;
  model: string;
  gmv: number;
  revenue: number;
  cost: number;
  margin_pct: number;
  status: "ok" | "warn" | "bad";
  initial: string;
  color: string;
}

export interface AlertData {
  kind: string;
  text: string;
  severity: "bad" | "warn";
}

export interface BillingConfig {
  base_model: BaseModel;
  bps: number;
  add_setup: boolean;
  add_ai: boolean;
  add_seats: boolean;
  cores: Record<string, boolean>;
  versions: { tariff: string; range: string; current?: boolean }[];
  contract: { id: string; owner: string; signed_at: string };
}

export interface InvoiceLine {
  label: string;
  count: number;
  note: string;
  amount: number;
  drilldown_key: string;
}

export interface Invoice {
  number: string;
  tenant_id: string;
  period: string;
  model: string;
  issued_at: string;
  rnc: string;
  lines: InvoiceLine[];
  min_guarantee: number;
  setup_note: string;
  subtotal: number;
  itbis: number;
  total: number;
}

export interface DrilldownEvent {
  type: string;
  id: string;
  detail: string;
  amount: number;
  time: string;
  hash: string;
  record_url: string;
}

export interface Drilldown {
  title: string;
  sub: string;
  agg_label: string;
  agg: number;
  aggValue: number;
  count: string;
  foot: string;
  events: DrilldownEvent[];
}

export interface ReconciliationMatch {
  label: string;
  events: number;
  billed: number;
  sum: number;
  drilldown_key: string;
  ok: boolean;
}

export interface Reconciliation {
  lines_count: number;
  events_count: number;
  reconciled_sum: number;
  discrepancy: number;
  matches: ReconciliationMatch[];
  ledger: DrilldownEvent[];
}

export type DrilldownKey =
  | "gmv"
  | "comision"
  | "ai"
  | "base"
  | "seats"
  | "takerate"
  | "mrr"
  | "margen";

export type DrilldownMap = Record<DrilldownKey, Drilldown>;

export interface WhatIfInput {
  base: BaseModel;
  bps: number;
  addSetup?: boolean;
  addAI?: boolean;
  addSeats?: boolean;
  principal?: number;
}

export interface WhatIfResult {
  subtotal: number;
  itbis: number;
  total: number;
  delta: number;
  lines: { label: string; amount: number }[];
}

export interface FunnelStepData {
  label: string;
  value: number;
  conv?: string;
}

/** P5 · Métricas del banco (ActorMetrics — aislado por tenant banco). */
export interface BankMetrics {
  tenant_id: string;
  period: string;
  model_label: string;
  funnel: FunnelStepData[];
  sla: {
    p50: string;
    p95: string;
    within_pct: number;
    reject_pct: number;
  };
  ai_usage: {
    decisions: number;
    documents: number;
    tokens: string;
    cost: number;
  };
  invoice_current: number;
  invoice_projected: number;
}

/** P6 · Métricas del dealer (ActorMetrics — aislado por tenant dealer). */
export interface DealerMetrics {
  tenant_id: string;
  period: string;
  plan: string;
  funnel: FunnelStepData[];
  look_to_book: { pct: number; delta: string };
  bank_mix: { name: string; initial: string; color: string; deals: number; pct: number }[];
  kpis: {
    volume: number;
    apr_pct: number;
    time_to_offer: string;
    seats: number;
  };
  dealer_fees: {
    limit_pct: number;
    base: number;
    requests_used: number;
    requests_limit: number;
    overage: number;
  };
}

/** P2 · Ingresos (admin god-view — HANDOFF §6BIS). */
export interface RevenueAnalytics {
  period: string;
  total: string;
  total_delta: string;
  gmv: string;
  gmv_delta: string;
  take_rate: string;
  ticket_medio: string;
  active_tenants: number;
  by_model: RevenueSlice[];
  gmv_vs_take: { month: string; gmv_h: number; take_h: number }[];
  by_tenant: {
    name: string;
    initial: string;
    color: string;
    gmv: number;
    revenue: number;
    pct: number;
    model: string;
    drilldown_key: DrilldownKey;
  }[];
}

/** P3 · Costo & margen (admin god-view — HANDOFF §6BIS). */
export interface CostMargin {
  period: string;
  margen_bruto: string;
  margen_delta: string;
  costo_servir: string;
  costo_servir_delta: string;
  costo_llm: string;
  costo_llm_share: string;
  tenants_bajo_umbral: number;
  umbral_pct: number;
  llm_by_core: RevenueSlice[];
  margin_by_tenant: {
    name: string;
    initial: string;
    color: string;
    revenue: number;
    cost: number;
    margin_pct: number;
    status: "ok" | "warn" | "bad";
  }[];
  guardrail: {
    tenant: string;
    margin_pct: number;
    umbral_pct: number;
    reason: string;
  };
}

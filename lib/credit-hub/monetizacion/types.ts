/** HANDOFF §7 — Monetización data contract (mock-first). */

export type TenantKind = "banco" | "dealer";

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

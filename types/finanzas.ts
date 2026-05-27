/**
 * Proyectos Finanzas — TypeScript types aligned with 00_MANIFIESTO_FASE_2.md Parte 3.
 * Frontend-only contract consumption; do not mutate without backend sync.
 */

export type CurrencyCode = "USD" | "DOP" | "EUR";

export interface FinanzasListFilters {
  status?: string[];
  search?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  /** Client-side page index (derived from limit/offset when API uses offset pagination). */
  page: number;
  page_size: number;
  /** Present on API responses using limit/offset pagination. */
  limit?: number;
  offset?: number;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price_usd: number;
  amount_usd: number;
  category?: string;
}

export interface BudgetSnapshot {
  project_id: string;
  tenant_id: string;
  envelope_usd: number;
  capex_usd: number;
  opex_usd: number;
  contingencia_usd: number;
  currency: CurrencyCode;
  updated_at?: string;
}

export interface BudgetVarianceRow {
  category: string;
  planned_usd: number;
  committed_usd: number;
  invoiced_usd: number;
  paid_usd: number;
  variance_pct: number;
}

export interface BudgetVarianceReport {
  project_id: string;
  rows: BudgetVarianceRow[];
  totals: BudgetVarianceRow;
}

export type CotizacionStatus = "received" | "approved" | "rejected" | "converted_to_po";
export type OrdenCompraStatus = "draft" | "issued" | "accepted" | "cancelled" | "closed";
export type FacturaValidationStatus =
  | "draft"
  | "pending"
  | "received"
  | "needs_pm_review"
  | "approved"
  | "rejected";
export type FacturaPaymentStatus = "unpaid" | "partial" | "paid";
/** API `estado_pago` values; UI maps draft/scheduled/processing → pending. */
export type PagoStatus =
  | "draft"
  | "scheduled"
  | "processing"
  | "pending"
  | "paid"
  | "reversed";
export type DealStatus = "open" | "closed" | "cancelled";

export type EconomicEventType =
  | "QUOTE_APPROVED"
  | "QUOTE_REJECTED"
  | "PO_ISSUED"
  | "PO_CANCELLED"
  | "PO_CLOSED"
  | "INVOICE_RECEIVED"
  | "INVOICE_VALIDATED"
  | "INVOICE_APPROVED"
  | "INVOICE_REJECTED"
  | "PAYMENT_REGISTERED"
  | "PAYMENT_CONFIRMED"
  | "PAYMENT_REVERSED"
  | "DEAL_CLOSED";

export interface Cotizacion {
  id: string;
  tenant_id: string;
  project_id: string;
  contratista_id: string;
  contratista_nombre: string;
  numero_cotizacion: string;
  categoria: string;
  monto_total_usd: number;
  currency: CurrencyCode;
  status: CotizacionStatus;
  fecha_emision: string;
  fecha_validez?: string;
  line_items: LineItem[];
  notas?: string;
  created_at: string;
  updated_at: string;
}

export interface OrdenCompra {
  id: string;
  tenant_id: string;
  project_id: string;
  cotizacion_id?: string;
  contratista_id: string;
  contratista_nombre: string;
  numero_oc: string;
  monto_total_usd: number;
  currency: CurrencyCode;
  status: OrdenCompraStatus;
  fecha_emision: string;
  fecha_entrega_esperada?: string;
  line_items: LineItem[];
  notas?: string;
  created_at: string;
  updated_at: string;
}

export interface Factura {
  id: string;
  tenant_id: string;
  project_id: string;
  orden_compra_id?: string;
  contratista_id: string;
  contratista_nombre: string;
  numero_factura: string;
  monto_total_usd: number;
  monto_pagado_usd: number;
  saldo_pendiente_usd: number;
  currency: CurrencyCode;
  validation_status: FacturaValidationStatus;
  payment_status: FacturaPaymentStatus;
  validation_reason_codes: string[];
  fecha_emision: string;
  fecha_vencimiento?: string;
  line_items: LineItem[];
  notas?: string;
  created_at: string;
  updated_at: string;
}

export interface Pago {
  id: string;
  tenant_id: string;
  project_id: string;
  factura_id: string;
  numero_pago: string;
  monto_usd: number;
  currency: CurrencyCode;
  status: PagoStatus;
  metodo_pago?: string;
  referencia?: string;
  fecha_programada?: string;
  fecha_pago?: string;
  actor_id?: string;
  reverse_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  tenant_id: string;
  project_id: string;
  titulo: string;
  contraparte: string;
  monto_usd: number;
  currency: CurrencyCode;
  status: DealStatus;
  fecha_inicio: string;
  fecha_cierre_esperada?: string;
  fecha_cierre?: string;
  notas?: string;
  created_at: string;
  updated_at: string;
}

export interface EconomicEvent {
  id: string;
  tenant_id: string;
  project_id: string;
  event_type: EconomicEventType;
  entity_type: string;
  entity_id: string;
  amount_usd: number;
  currency: CurrencyCode;
  actor_id?: string;
  description: string;
  metadata?: Record<string, unknown>;
  occurred_at: string;
  created_at: string;
}

export interface FinanceOverviewKpis {
  presupuesto_total_usd: number;
  capex_aprobado_usd: number;
  opex_aprobado_usd: number;
  comprometido_usd: number;
  facturado_usd: number;
  pagado_usd: number;
  saldo_pendiente_usd: number;
  variance_pct: number;
}

export interface FinanceAlert {
  id: string;
  severity: "info" | "warning" | "error";
  title: string;
  description: string;
}

export interface FinanceOverview {
  kpis: FinanceOverviewKpis;
  recent_events: EconomicEvent[];
  alerts: FinanceAlert[];
}

export interface ApprovalBody {
  justification: string;
  actor_id?: string;
  reason_codes?: string[];
}

export interface RejectBody {
  justification: string;
  actor_id?: string;
  reason_codes?: string[];
}

export interface ConvertCotizacionToPOBody {
  numero_oc?: string;
  monto_total_usd?: number;
  fecha_entrega_esperada?: string;
  notas?: string;
  actor_id?: string;
}

export interface IssueOrdenCompraBody {
  actor_id?: string;
  justification?: string;
}

export interface CancelOrdenCompraBody {
  justification: string;
  actor_id?: string;
}

export interface CloseOrdenCompraBody {
  justification: string;
  actor_id?: string;
}

export interface ConfirmPagoBody {
  actor_id?: string;
  referencia?: string;
}

export interface ReversePagoBody {
  reason: string;
  actor_id?: string;
}

export interface CloseDealBody {
  justification: string;
  actor_id?: string;
}

export type CreateCotizacionPayload = Omit<Cotizacion, "id" | "created_at" | "updated_at" | "status"> & {
  status?: CotizacionStatus;
};

export type UpdateCotizacionPayload = Partial<Omit<Cotizacion, "id" | "tenant_id" | "project_id" | "created_at">>;

export type CreateOrdenCompraPayload = Omit<OrdenCompra, "id" | "created_at" | "updated_at" | "status" | "numero_oc"> & {
  status?: OrdenCompraStatus;
  numero_oc?: string;
};

export type UpdateOrdenCompraPayload = Partial<Omit<OrdenCompra, "id" | "tenant_id" | "project_id" | "created_at">>;

export type CreateFacturaPayload = Omit<
  Factura,
  | "id"
  | "created_at"
  | "updated_at"
  | "validation_status"
  | "payment_status"
  | "validation_reason_codes"
  | "monto_pagado_usd"
  | "saldo_pendiente_usd"
> & {
  validation_status?: FacturaValidationStatus;
};

export type UpdateFacturaPayload = Partial<Omit<Factura, "id" | "tenant_id" | "project_id" | "created_at">>;

export type CreatePagoPayload = Omit<Pago, "id" | "created_at" | "updated_at" | "status" | "numero_pago"> & {
  status?: PagoStatus;
};

export type UpdatePagoPayload = Partial<Omit<Pago, "id" | "tenant_id" | "project_id" | "created_at">>;

export type CreateDealPayload = Omit<Deal, "id" | "created_at" | "updated_at" | "status"> & {
  status?: DealStatus;
};

export type UpdateDealPayload = Partial<Omit<Deal, "id" | "tenant_id" | "project_id" | "created_at">>;

export type UpdateBudgetPayload = {
  envelope_usd?: number;
  capex_usd?: number;
  opex_usd?: number;
  contingencia_usd?: number;
  actor_id?: string;
};

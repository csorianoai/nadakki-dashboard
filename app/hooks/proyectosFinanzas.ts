/**
 * Proyectos Finanzas hooks — production API (facturas, pagos, eventos, cotizaciones, OC, deals, budget).
 * Overview/variance KPIs remain mock until dedicated backend endpoints ship.
 */

import { getAuthHeaders, resolveApiUrl } from "@/lib/api/fetch-client";
import * as mock from "@/lib/mocks/finanzas-api";
import type {
  ApprovalBody,
  BudgetSnapshot,
  BudgetVarianceReport,
  CancelOrdenCompraBody,
  CloseDealBody,
  CloseOrdenCompraBody,
  ConfirmPagoBody,
  ConvertCotizacionToPOBody,
  Cotizacion,
  CreateCotizacionPayload,
  CreateDealPayload,
  CreateFacturaPayload,
  CreateOrdenCompraPayload,
  CreatePagoPayload,
  CurrencyCode,
  Deal,
  EconomicEvent,
  EconomicEventType,
  Factura,
  FinanzasListFilters,
  FinanceOverview,
  IssueOrdenCompraBody,
  LineItem,
  OrdenCompra,
  PaginatedResponse,
  Pago,
  PagoStatus,
  RejectBody,
  ReversePagoBody,
  UpdateBudgetPayload,
  UpdateCotizacionPayload,
  UpdateDealPayload,
  UpdateFacturaPayload,
  UpdateOrdenCompraPayload,
  UpdatePagoPayload,
} from "@/types/finanzas";

const PROJECTS_BASE = resolveApiUrl("/api/v1/proyectos");

/** Set NEXT_PUBLIC_FINANZAS_USE_MOCKS=true to force in-memory mocks (local dev). */
const USE_MOCKS =
  typeof process !== "undefined" &&
  process.env.NEXT_PUBLIC_FINANZAS_USE_MOCKS === "true";

export class FinanzasApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly detail?: unknown,
  ) {
    super(message);
    this.name = "FinanzasApiError";
  }
}

// ── HTTP helpers ───────────────────────────────────────────────────────────

function extractApiDetail(body: unknown, fallback: string): string {
  if (typeof body === "string" && body.trim()) return body;
  if (body && typeof body === "object") {
    const o = body as Record<string, unknown>;
    if (typeof o.detail === "string") return o.detail;
    if (Array.isArray(o.detail)) {
      return o.detail
        .map((d) =>
          typeof d === "object" && d && "msg" in d
            ? String((d as { msg: string }).msg)
            : JSON.stringify(d),
        )
        .join("; ");
    }
    if (o.error && typeof o.error === "object") {
      const err = o.error as Record<string, unknown>;
      if (typeof err.message === "string") return err.message;
    }
    if (typeof o.message === "string") return o.message;
  }
  return fallback;
}

function mapHttpError(status: number, body: unknown, fallback: string): FinanzasApiError {
  const detail = extractApiDetail(body, fallback);
  if (status === 400 && /tenant|X-Tenant-ID/i.test(detail)) {
    return new FinanzasApiError("Sesión expirada, recarga la página", status, body);
  }
  if (status === 404) {
    return new FinanzasApiError(
      detail.toLowerCase().includes("not found")
        ? "Recurso no encontrado o sin permisos"
        : detail,
      status,
      body,
    );
  }
  return new FinanzasApiError(detail, status, body);
}

function finanzasHeaders(tenantId: string, jsonBody = true): HeadersInit {
  const h: Record<string, string> = {
    Accept: "application/json",
    "X-Tenant-ID": tenantId.trim(),
    ...getAuthHeaders(),
  };
  if (jsonBody) h["Content-Type"] = "application/json";
  return h;
}

async function finanzasFetch<T>(
  tenantId: string,
  path: string,
  init?: RequestInit & { omitJsonContentType?: boolean },
): Promise<T> {
  const method = (init?.method ?? "GET").toUpperCase();
  const hasBody = init?.body != null && method !== "GET" && method !== "HEAD";
  const url = `${PROJECTS_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const { omitJsonContentType, ...rest } = init ?? {};
  const res = await fetch(url, {
    ...rest,
    method,
    headers: finanzasHeaders(tenantId, hasBody && !omitJsonContentType),
    credentials: rest.credentials ?? "include",
  });

  if (res.status === 204) return undefined as T;

  const text = await res.text().catch(() => "");
  let parsed: unknown;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }

  if (!res.ok) {
    throw mapHttpError(res.status, parsed, res.statusText || "Error de API");
  }
  return parsed as T;
}

function listQuery(filters?: FinanzasListFilters): string {
  const limit = filters?.page_size ?? 100;
  const offset = filters?.page ? (filters.page - 1) * limit : 0;
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  params.set("offset", String(offset));
  if (filters?.status?.length) {
    const mapped = filters.status.map((s) => (s === "received" ? "pending" : s));
    params.set("status", mapped.join(","));
  }
  if (filters?.date_from) params.set("fecha_desde", filters.date_from);
  if (filters?.date_to) params.set("fecha_hasta", filters.date_to);
  const q = params.toString();
  return q ? `?${q}` : "";
}

function toPaginated<T>(
  raw: { items: unknown[]; total: number; limit?: number; offset?: number },
  mapItem: (row: Record<string, unknown>) => T,
): PaginatedResponse<T> {
  const limit = raw.limit ?? 100;
  const offset = raw.offset ?? 0;
  return {
    items: (raw.items ?? []).map((row) => mapItem(row as Record<string, unknown>)),
    total: raw.total ?? 0,
    page: Math.floor(offset / limit) + 1,
    page_size: limit,
    limit,
    offset,
  };
}

function parseLineItems(raw: unknown): LineItem[] {
  if (Array.isArray(raw)) return raw as LineItem[];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as LineItem[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function parseReasonCodes(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function mapValidationStatus(raw: string): Factura["validation_status"] {
  if (raw === "pending") return "received";
  return raw as Factura["validation_status"];
}

function toFactura(row: Record<string, unknown>, extras?: Partial<Factura>): Factura {
  const montoTotal = Number(row.monto_total_usd ?? 0);
  const totalPaid = Number(row.total_paid_usd ?? row.monto_pagado_usd ?? 0);
  const saldo =
    row.saldo_pendiente_usd != null
      ? Number(row.saldo_pendiente_usd)
      : Math.max(0, montoTotal - totalPaid);
  let paymentStatus = (row.payment_status as Factura["payment_status"]) ?? "unpaid";
  if (!row.payment_status && totalPaid > 0) {
    paymentStatus = totalPaid >= montoTotal ? "paid" : "partial";
  }

  return {
    id: String(row.id),
    tenant_id: String(row.tenant_id),
    project_id: String(row.project_id),
    orden_compra_id: row.orden_compra_id ? String(row.orden_compra_id) : undefined,
    contratista_id: String(row.contratista_id ?? ""),
    contratista_nombre: String(
      row.contratista_nombre ?? extras?.contratista_nombre ?? row.contratista_id ?? "Contratista",
    ),
    numero_factura: String(row.numero_factura ?? ""),
    monto_total_usd: montoTotal,
    monto_pagado_usd: totalPaid,
    saldo_pendiente_usd: saldo,
    currency: (String(row.moneda_original ?? row.currency ?? "USD") as CurrencyCode),
    validation_status: mapValidationStatus(String(row.validation_status ?? "pending")),
    payment_status: paymentStatus,
    validation_reason_codes: parseReasonCodes(row.validation_reason_codes),
    fecha_emision: String(row.fecha_emision ?? "").slice(0, 10),
    fecha_vencimiento: row.fecha_vencimiento
      ? String(row.fecha_vencimiento).slice(0, 10)
      : undefined,
    line_items: parseLineItems(row.line_items),
    notas: row.decision_notes ? String(row.decision_notes) : row.notas ? String(row.notas) : undefined,
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? row.created_at ?? new Date().toISOString()),
    ...extras,
  };
}

function mapPagoStatus(raw: string): PagoStatus {
  if (raw === "draft" || raw === "scheduled" || raw === "processing") return "pending";
  return raw as PagoStatus;
}

function toPago(row: Record<string, unknown>): Pago {
  return {
    id: String(row.id),
    tenant_id: String(row.tenant_id),
    project_id: String(row.project_id),
    factura_id: String(row.factura_id ?? ""),
    numero_pago: String(row.numero_pago ?? ""),
    monto_usd: Number(row.monto_pagado_usd ?? row.monto_usd ?? 0),
    currency: (String(row.moneda_original ?? row.currency ?? "USD") as CurrencyCode),
    status: mapPagoStatus(String(row.status ?? "draft")),
    metodo_pago: row.metodo_pago ? String(row.metodo_pago) : undefined,
    referencia: row.referencia_bancaria
      ? String(row.referencia_bancaria)
      : row.referencia
        ? String(row.referencia)
        : undefined,
    fecha_programada: row.fecha_programada ? String(row.fecha_programada).slice(0, 10) : undefined,
    fecha_pago: row.fecha_pago ? String(row.fecha_pago).slice(0, 10) : undefined,
    actor_id: row.approved_by ? String(row.approved_by) : row.actor_id ? String(row.actor_id) : undefined,
    reverse_reason: row.reverse_reason ? String(row.reverse_reason) : undefined,
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? row.created_at ?? new Date().toISOString()),
  };
}

function toEconomicEvent(row: Record<string, unknown>): EconomicEvent {
  const payload = (row.payload as Record<string, unknown> | null) ?? {};
  return {
    id: String(row.id),
    tenant_id: String(row.tenant_id),
    project_id: String(row.project_id),
    event_type: String(row.event_type ?? "INVOICE_RECEIVED") as EconomicEventType,
    entity_type: String(row.source_module ?? payload.entity_type ?? ""),
    entity_id: String(row.source_id ?? payload.entity_id ?? ""),
    amount_usd: Number(row.amount_usd ?? 0),
    currency: (String(row.currency ?? "USD") as CurrencyCode),
    actor_id: payload.actor_id ? String(payload.actor_id) : undefined,
    description: String(
      payload.description ??
        payload.justification ??
        payload.action ??
        row.event_type ??
        "Evento económico",
    ),
    metadata: payload,
    occurred_at: String(row.event_date ?? row.occurred_at ?? row.created_at ?? new Date().toISOString()),
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

function unwrapRecord(raw: Record<string, unknown>, keys: string[]): Record<string, unknown> {
  for (const key of keys) {
    const nested = raw[key];
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      return nested as Record<string, unknown>;
    }
  }
  return raw;
}

function toCotizacion(row: Record<string, unknown>, extras?: Partial<Cotizacion>): Cotizacion {
  const contratista = row.contratista as Record<string, unknown> | null | undefined;
  return {
    id: String(row.id),
    tenant_id: String(row.tenant_id),
    project_id: String(row.project_id),
    contratista_id: String(row.contratista_id ?? ""),
    contratista_nombre: String(
      extras?.contratista_nombre ?? contratista?.razon_social ?? row.contratista_nombre ?? "Contratista",
    ),
    numero_cotizacion: String(row.numero_cotizacion ?? ""),
    categoria: String(extras?.categoria ?? row.categoria ?? row.notes ?? "General"),
    monto_total_usd: Number(row.monto_total_usd ?? 0),
    currency: (String(row.moneda_original ?? row.currency ?? "USD") as CurrencyCode),
    status: String(row.status ?? "draft") as Cotizacion["status"],
    fecha_emision: String(row.fecha_emision ?? "").slice(0, 10),
    fecha_validez: row.fecha_vencimiento ? String(row.fecha_vencimiento).slice(0, 10) : undefined,
    line_items: parseLineItems(row.line_items),
    notas: row.notes ? String(row.notes) : undefined,
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? row.created_at ?? new Date().toISOString()),
    ...extras,
  };
}

function toOrdenCompra(row: Record<string, unknown>, extras?: Partial<OrdenCompra>): OrdenCompra {
  const contratista = row.contratista as Record<string, unknown> | null | undefined;
  return {
    id: String(row.id),
    tenant_id: String(row.tenant_id),
    project_id: String(row.project_id),
    cotizacion_id: row.cotizacion_id ? String(row.cotizacion_id) : undefined,
    contratista_id: String(row.contratista_id ?? ""),
    contratista_nombre: String(
      extras?.contratista_nombre ?? contratista?.razon_social ?? row.contratista_nombre ?? "Contratista",
    ),
    numero_oc: String(row.numero_oc ?? ""),
    monto_total_usd: Number(row.monto_total_usd ?? 0),
    currency: (String(row.moneda_original ?? row.currency ?? "USD") as CurrencyCode),
    status: String(row.status ?? "draft") as OrdenCompra["status"],
    fecha_emision: String(row.fecha_emision ?? "").slice(0, 10),
    fecha_entrega_esperada: row.fecha_entrega_esperada
      ? String(row.fecha_entrega_esperada).slice(0, 10)
      : undefined,
    line_items: parseLineItems(row.line_items),
    notas: row.notes ? String(row.notes) : undefined,
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? row.created_at ?? new Date().toISOString()),
    ...extras,
  };
}

function mapDealStatus(raw: string): Deal["status"] {
  if (raw === "closed") return "closed";
  if (raw === "cancelled") return "cancelled";
  return "open";
}

function toDeal(row: Record<string, unknown>, extras?: Partial<Deal>): Deal {
  return {
    id: String(row.id),
    tenant_id: String(row.tenant_id ?? extras?.tenant_id ?? ""),
    project_id: String(row.project_id),
    titulo: String(row.deal_name ?? extras?.titulo ?? ""),
    contraparte: String(extras?.contraparte ?? row.counterparty_type ?? "Contraparte"),
    monto_usd: Number(row.deal_value_usd ?? extras?.monto_usd ?? 0),
    currency: (String(row.currency ?? "USD") as CurrencyCode),
    status: mapDealStatus(String(row.status ?? "drafting")),
    fecha_inicio: String(row.initiated_at ?? extras?.fecha_inicio ?? row.created_at ?? "")
      .slice(0, 10),
    fecha_cierre_esperada: extras?.fecha_cierre_esperada,
    fecha_cierre: row.closed_at ? String(row.closed_at).slice(0, 10) : undefined,
    notas: row.notes ? String(row.notes) : undefined,
    created_at: String(row.initiated_at ?? row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? row.initiated_at ?? row.created_at ?? new Date().toISOString()),
    ...extras,
  };
}

function toCreateCotizacionBody(payload: CreateCotizacionPayload): Record<string, unknown> {
  return {
    contratista_id: payload.contratista_id,
    numero_cotizacion: payload.numero_cotizacion,
    fecha_emision: payload.fecha_emision,
    monto_subtotal_usd: payload.monto_total_usd,
    monto_total_usd: payload.monto_total_usd,
    monto_impuesto_usd: 0,
    moneda_original: payload.currency ?? "USD",
    line_items: payload.line_items ?? [],
    notes: payload.notas ?? payload.categoria,
    fecha_vencimiento: payload.fecha_validez,
    created_by: "dashboard-user",
  };
}

function toCreateOrdenCompraBody(payload: CreateOrdenCompraPayload): Record<string, unknown> {
  return {
    contratista_id: payload.contratista_id,
    cotizacion_id: payload.cotizacion_id,
    numero_oc: payload.numero_oc ?? `OC-${Date.now()}`,
    fecha_emision: payload.fecha_emision,
    monto_subtotal_usd: payload.monto_total_usd,
    monto_total_usd: payload.monto_total_usd,
    monto_impuesto_usd: 0,
    moneda_original: payload.currency ?? "USD",
    line_items: payload.line_items ?? [],
    notes: payload.notas,
    created_by: "dashboard-user",
  };
}

function toCreateDealBody(payload: CreateDealPayload): Record<string, unknown> {
  return {
    deal_type: (payload as CreateDealPayload & { deal_type?: string }).deal_type ?? "jv",
    deal_name: payload.titulo,
    counterparty_name: payload.contraparte,
    counterparty_type:
      (payload as CreateDealPayload & { counterparty_type?: string }).counterparty_type ?? "developer",
    deal_value_usd: payload.monto_usd,
    counterparty_country: (payload as CreateDealPayload & { counterparty_country?: string })
      .counterparty_country,
    created_by: "dashboard-user",
  };
}

function filterBySearch<T>(items: T[], search?: string): T[] {
  if (!search?.trim()) return items;
  const q = search.trim().toLowerCase();
  return items.filter((row) => JSON.stringify(row).toLowerCase().includes(q));
}

function toCreateFacturaBody(payload: CreateFacturaPayload): Record<string, unknown> {
  return {
    contratista_id: payload.contratista_id,
    numero_factura: payload.numero_factura,
    fecha_emision: payload.fecha_emision,
    monto_subtotal_usd: payload.monto_total_usd,
    monto_total_usd: payload.monto_total_usd,
    monto_impuesto_usd: 0,
    moneda_original: payload.currency ?? "USD",
    line_items: payload.line_items ?? [],
    orden_compra_id: payload.orden_compra_id,
    created_by: "dashboard-user",
  };
}

function toCreatePagoBody(payload: CreatePagoPayload): Record<string, unknown> {
  const stamp = Date.now();
  return {
    factura_id: payload.factura_id,
    numero_pago: `PAG-${stamp}`,
    fecha_pago: payload.fecha_pago ?? new Date().toISOString().slice(0, 10),
    monto_pagado_usd: payload.monto_usd,
    metodo_pago: payload.metodo_pago ?? "transferencia",
    referencia_bancaria: payload.referencia,
    moneda_original: payload.currency ?? "USD",
    created_by: "dashboard-user",
  };
}

async function enrichFacturasWithPayment(
  tenantId: string,
  items: Factura[],
): Promise<Factura[]> {
  const approved = items.filter((f) => f.validation_status === "approved");
  if (!approved.length) return items;
  const enriched = await Promise.all(
    approved.map(async (f) => {
      try {
        const detail = await getFactura(tenantId, f.id);
        return detail ?? f;
      } catch {
        return f;
      }
    }),
  );
  const byId = new Map(enriched.map((f) => [f.id, f]));
  return items.map((f) => byId.get(f.id) ?? f);
}

// ── Budget / overview ──────────────────────────────────────────────────────

export async function getFinanceOverview(tenantId: string, projectId: string): Promise<FinanceOverview> {
  // TODO[finanzas-overview-backend]: no GET /finanzas/overview in prod (404) — keep mock KPIs
  return mock.mockGetFinanceOverview(tenantId, projectId);
}

export async function getBudget(tenantId: string, projectId: string): Promise<BudgetSnapshot> {
  if (USE_MOCKS) return mock.mockGetBudget(tenantId, projectId);

  const row = await finanzasFetch<Record<string, unknown>>(tenantId, `/${projectId}`);
  const envelope = Number(row.budget_envelope_usd ?? 0);
  const pct = Number(row.budget_contingencia_pct ?? 10);
  return {
    project_id: String(row.id ?? projectId),
    tenant_id: String(row.tenant_id ?? tenantId),
    envelope_usd: envelope,
    capex_usd: Number(row.budget_capex_usd ?? 0),
    opex_usd: Number(row.budget_opex_usd ?? 0),
    contingencia_usd: envelope > 0 ? (envelope * pct) / 100 : 0,
    currency: "USD",
    updated_at: row.updated_at ? String(row.updated_at) : undefined,
  };
}

export async function getBudgetVariance(tenantId: string, projectId: string): Promise<BudgetVarianceReport> {
  // TODO[finanzas-variance-backend]: no variance endpoint in prod — keep mock report
  return mock.mockGetBudgetVariance(tenantId, projectId);
}

export async function updateBudget(
  tenantId: string,
  projectId: string,
  payload: UpdateBudgetPayload,
): Promise<BudgetSnapshot> {
  if (USE_MOCKS) return mock.mockUpdateBudget(tenantId, projectId, payload);

  await finanzasFetch<Record<string, unknown>>(tenantId, `/${projectId}`, {
    method: "PATCH",
    body: JSON.stringify({
      budget_envelope_usd: payload.envelope_usd,
      budget_capex_usd: payload.capex_usd,
      budget_opex_usd: payload.opex_usd,
      updated_by: payload.actor_id ?? "dashboard-user",
    }),
  });
  return getBudget(tenantId, projectId);
}

// ── Facturas (API) ───────────────────────────────────────────────────────

export async function listFacturas(
  tenantId: string,
  projectId: string,
  filters?: FinanzasListFilters,
): Promise<PaginatedResponse<Factura>> {
  if (USE_MOCKS) return mock.mockListFacturas(tenantId, projectId, filters);

  const raw = await finanzasFetch<{ items: unknown[]; total: number; limit?: number; offset?: number }>(
    tenantId,
    `/${projectId}/facturas${listQuery(filters)}`,
  );
  let items = toPaginated(raw, toFactura).items;
  if (filters?.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    items = items.filter((f) => JSON.stringify(f).toLowerCase().includes(q));
  }
  if (filters?.status?.includes("approved")) {
    items = await enrichFacturasWithPayment(tenantId, items);
  }
  return {
    ...toPaginated({ ...raw, items: items as unknown[] }, toFactura),
    items,
    total: filters?.search ? items.length : raw.total,
  };
}

export async function getFactura(tenantId: string, facturaId: string): Promise<Factura | null> {
  if (USE_MOCKS) return mock.mockGetFactura(tenantId, facturaId);
  try {
    const row = await finanzasFetch<Record<string, unknown>>(tenantId, `/facturas/${facturaId}`);
    return toFactura(row);
  } catch (e) {
    if (e instanceof FinanzasApiError && e.status === 404) return null;
    throw e;
  }
}

export async function createFactura(
  tenantId: string,
  projectId: string,
  payload: CreateFacturaPayload,
): Promise<Factura> {
  if (USE_MOCKS) return mock.mockCreateFactura(tenantId, projectId, payload);

  const row = await finanzasFetch<Record<string, unknown>>(tenantId, `/${projectId}/facturas`, {
    method: "POST",
    body: JSON.stringify(toCreateFacturaBody(payload)),
  });
  return toFactura(row, { contratista_nombre: payload.contratista_nombre });
}

export async function updateFactura(
  tenantId: string,
  facturaId: string,
  payload: UpdateFacturaPayload,
): Promise<Factura> {
  if (USE_MOCKS) return mock.mockUpdateFactura(tenantId, facturaId, payload);

  const body: Record<string, unknown> = {};
  if (payload.numero_factura != null) body.numero_factura = payload.numero_factura;
  if (payload.fecha_emision != null) body.fecha_emision = payload.fecha_emision;
  if (payload.monto_total_usd != null) {
    body.monto_total_usd = payload.monto_total_usd;
    body.monto_subtotal_usd = payload.monto_total_usd;
  }
  if (payload.line_items != null) body.line_items = payload.line_items;
  if (payload.orden_compra_id != null) body.orden_compra_id = payload.orden_compra_id;
  if (payload.notas != null) body.decision_notes = payload.notas;

  const row = await finanzasFetch<Record<string, unknown>>(tenantId, `/facturas/${facturaId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return toFactura(row, { contratista_nombre: payload.contratista_nombre });
}

export async function approveFactura(
  tenantId: string,
  facturaId: string,
  body: ApprovalBody,
): Promise<Factura> {
  if (USE_MOCKS) return mock.mockApproveFactura(tenantId, facturaId, body);

  const row = await finanzasFetch<Record<string, unknown>>(tenantId, `/facturas/${facturaId}/approve`, {
    method: "POST",
    body: JSON.stringify({
      actor_id: body.actor_id ?? "dashboard-user",
      justification: body.justification,
      notes: body.justification,
    }),
  });
  return toFactura(row);
}

export async function rejectFactura(
  tenantId: string,
  facturaId: string,
  body: RejectBody,
): Promise<Factura> {
  if (USE_MOCKS) return mock.mockRejectFactura(tenantId, facturaId, body);

  const row = await finanzasFetch<Record<string, unknown>>(tenantId, `/facturas/${facturaId}/reject`, {
    method: "POST",
    body: JSON.stringify({
      actor_id: body.actor_id ?? "dashboard-user",
      justification: body.justification,
      reason_codes: body.reason_codes?.length ? body.reason_codes : ["PM_REJECT"],
    }),
  });
  return toFactura(row);
}

export async function deleteFactura(tenantId: string, facturaId: string): Promise<void> {
  if (USE_MOCKS) return mock.mockDeleteFactura(tenantId, facturaId);
  await finanzasFetch<void>(tenantId, `/facturas/${facturaId}`, { method: "DELETE" });
}

// ── Contratistas ──────────────────────────────────────────────────────────

export interface Contratista {
  id: string;
  razon_social: string;
  nombre_comercial?: string;
}

export interface CreateContratistaPayload {
  razon_social: string;
  tax_id: string;
  pais_origen?: string;
  nombre_comercial?: string;
}

function toContratista(row: Record<string, unknown>): Contratista {
  return {
    id: String(row.id ?? ""),
    razon_social: String(row.razon_social ?? ""),
    nombre_comercial: row.nombre_comercial ? String(row.nombre_comercial) : undefined,
  };
}

/** Tenant-scoped list — GET /api/v1/proyectos/contratistas */
export async function listContratistas(tenantId: string): Promise<Contratista[]> {
  if (USE_MOCKS) {
    return [
      { id: "cont-001", razon_social: "Constructora del Caribe SRL", nombre_comercial: "CDC" },
      { id: "cont-002", razon_social: "Instalaciones Técnicas RD" },
    ];
  }
  const raw = await finanzasFetch<Record<string, unknown>[]>(tenantId, `/contratistas`);
  return (Array.isArray(raw) ? raw : []).map((r) => toContratista(r));
}

export async function createContratista(
  tenantId: string,
  payload: CreateContratistaPayload,
): Promise<Contratista> {
  if (USE_MOCKS) {
    return {
      id: crypto.randomUUID(),
      razon_social: payload.razon_social,
      nombre_comercial: payload.nombre_comercial,
    };
  }
  const row = await finanzasFetch<Record<string, unknown>>(tenantId, `/contratistas`, {
    method: "POST",
    body: JSON.stringify({
      razon_social: payload.razon_social,
      tax_id: payload.tax_id,
      pais_origen: payload.pais_origen ?? "DO",
      nombre_comercial: payload.nombre_comercial,
      created_by: "dashboard-user",
    }),
  });
  return toContratista(row);
}

// ── Cotizaciones (API) ─────────────────────────────────────────────────────

export async function listCotizaciones(
  tenantId: string,
  projectId: string,
  filters?: FinanzasListFilters,
): Promise<PaginatedResponse<Cotizacion>> {
  if (USE_MOCKS) return mock.mockListCotizaciones(tenantId, projectId, filters);

  const raw = await finanzasFetch<{ items: unknown[]; total: number; limit?: number; offset?: number }>(
    tenantId,
    `/${projectId}/cotizaciones${listQuery(filters)}`,
  );
  let items = toPaginated(raw, toCotizacion).items;
  items = filterBySearch(items, filters?.search);
  return {
    ...toPaginated({ ...raw, items: items as unknown[] }, toCotizacion),
    items,
    total: filters?.search ? items.length : raw.total,
  };
}

export async function getCotizacion(tenantId: string, cotizacionId: string): Promise<Cotizacion | null> {
  if (USE_MOCKS) return mock.mockGetCotizacion(tenantId, cotizacionId);
  try {
    const row = await finanzasFetch<Record<string, unknown>>(tenantId, `/cotizaciones/${cotizacionId}`);
    return toCotizacion(row);
  } catch (e) {
    if (e instanceof FinanzasApiError && e.status === 404) return null;
    throw e;
  }
}

export async function createCotizacion(
  tenantId: string,
  projectId: string,
  payload: CreateCotizacionPayload,
): Promise<Cotizacion> {
  if (USE_MOCKS) return mock.mockCreateCotizacion(tenantId, projectId, payload);

  const raw = await finanzasFetch<Record<string, unknown>>(tenantId, `/${projectId}/cotizaciones`, {
    method: "POST",
    body: JSON.stringify(toCreateCotizacionBody(payload)),
  });
  const row = unwrapRecord(raw, ["cotizacion"]);
  return toCotizacion(row, {
    contratista_nombre: payload.contratista_nombre,
    categoria: payload.categoria,
  });
}

export async function updateCotizacion(
  tenantId: string,
  cotizacionId: string,
  payload: UpdateCotizacionPayload,
): Promise<Cotizacion> {
  if (USE_MOCKS) return mock.mockUpdateCotizacion(tenantId, cotizacionId, payload);

  const body: Record<string, unknown> = {};
  if (payload.monto_total_usd != null) {
    body.monto_total_usd = payload.monto_total_usd;
    body.monto_subtotal_usd = payload.monto_total_usd;
  }
  if (payload.line_items != null) body.line_items = payload.line_items;
  if (payload.notas != null) body.notes = payload.notas;
  if (payload.fecha_validez != null) body.fecha_vencimiento = payload.fecha_validez;

  const row = await finanzasFetch<Record<string, unknown>>(tenantId, `/cotizaciones/${cotizacionId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return toCotizacion(row, {
    contratista_nombre: payload.contratista_nombre,
    categoria: payload.categoria,
  });
}

export async function approveCotizacion(
  tenantId: string,
  cotizacionId: string,
  body: ApprovalBody,
): Promise<Cotizacion> {
  if (USE_MOCKS) return mock.mockApproveCotizacion(tenantId, cotizacionId, body);

  const row = await finanzasFetch<Record<string, unknown>>(tenantId, `/cotizaciones/${cotizacionId}/approve`, {
    method: "POST",
    body: JSON.stringify({
      actor_id: body.actor_id ?? "dashboard-user",
      justification: body.justification,
    }),
  });
  return toCotizacion(row);
}

export async function rejectCotizacion(
  tenantId: string,
  cotizacionId: string,
  body: RejectBody,
): Promise<Cotizacion> {
  if (USE_MOCKS) return mock.mockRejectCotizacion(tenantId, cotizacionId, body);

  const row = await finanzasFetch<Record<string, unknown>>(tenantId, `/cotizaciones/${cotizacionId}/reject`, {
    method: "POST",
    body: JSON.stringify({
      actor_id: body.actor_id ?? "dashboard-user",
      justification: body.justification,
      reason_codes: body.reason_codes?.length ? body.reason_codes : ["PM_REJECT"],
    }),
  });
  return toCotizacion(row);
}

export async function convertCotizacionToPO(
  tenantId: string,
  cotizacionId: string,
  body: ConvertCotizacionToPOBody,
): Promise<OrdenCompra> {
  if (USE_MOCKS) return mock.mockConvertCotizacionToPO(tenantId, cotizacionId, body);

  const raw = await finanzasFetch<Record<string, unknown>>(
    tenantId,
    `/cotizaciones/${cotizacionId}/convert-to-po`,
    {
      method: "POST",
      body: JSON.stringify({
        actor_id: body.actor_id ?? "dashboard-user",
      }),
    },
  );
  const oc = unwrapRecord(raw, ["orden_compra"]);
  return toOrdenCompra(oc);
}

export async function deleteCotizacion(tenantId: string, cotizacionId: string): Promise<void> {
  if (USE_MOCKS) return mock.mockDeleteCotizacion(tenantId, cotizacionId);
  await finanzasFetch<void>(tenantId, `/cotizaciones/${cotizacionId}`, { method: "DELETE" });
}

// ── Ordenes de Compra (API) ────────────────────────────────────────────────

export async function listOrdenesCompra(
  tenantId: string,
  projectId: string,
  filters?: FinanzasListFilters,
): Promise<PaginatedResponse<OrdenCompra>> {
  if (USE_MOCKS) return mock.mockListOrdenesCompra(tenantId, projectId, filters);

  const raw = await finanzasFetch<{ items: unknown[]; total: number; limit?: number; offset?: number }>(
    tenantId,
    `/${projectId}/ordenes-compra${listQuery(filters)}`,
  );
  let items = toPaginated(raw, toOrdenCompra).items;
  items = filterBySearch(items, filters?.search);
  return {
    ...toPaginated({ ...raw, items: items as unknown[] }, toOrdenCompra),
    items,
    total: filters?.search ? items.length : raw.total,
  };
}

export async function getOrdenCompra(tenantId: string, ocId: string): Promise<OrdenCompra | null> {
  if (USE_MOCKS) return mock.mockGetOrdenCompra(tenantId, ocId);
  try {
    const row = await finanzasFetch<Record<string, unknown>>(tenantId, `/ordenes-compra/${ocId}`);
    return toOrdenCompra(row);
  } catch (e) {
    if (e instanceof FinanzasApiError && e.status === 404) return null;
    throw e;
  }
}

export async function createOrdenCompra(
  tenantId: string,
  projectId: string,
  payload: CreateOrdenCompraPayload,
): Promise<OrdenCompra> {
  if (USE_MOCKS) return mock.mockCreateOrdenCompra(tenantId, projectId, payload);

  const raw = await finanzasFetch<Record<string, unknown>>(tenantId, `/${projectId}/ordenes-compra`, {
    method: "POST",
    body: JSON.stringify(toCreateOrdenCompraBody(payload)),
  });
  const row = unwrapRecord(raw, ["orden_compra"]);
  return toOrdenCompra(row, { contratista_nombre: payload.contratista_nombre });
}

export async function updateOrdenCompra(
  tenantId: string,
  ocId: string,
  payload: UpdateOrdenCompraPayload,
): Promise<OrdenCompra> {
  if (USE_MOCKS) return mock.mockUpdateOrdenCompra(tenantId, ocId, payload);

  const body: Record<string, unknown> = {};
  if (payload.monto_total_usd != null) {
    body.monto_total_usd = payload.monto_total_usd;
    body.monto_subtotal_usd = payload.monto_total_usd;
  }
  if (payload.line_items != null) body.line_items = payload.line_items;
  if (payload.notas != null) body.notes = payload.notas;

  const row = await finanzasFetch<Record<string, unknown>>(tenantId, `/ordenes-compra/${ocId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return toOrdenCompra(row, { contratista_nombre: payload.contratista_nombre });
}

export async function issueOrdenCompra(
  tenantId: string,
  ocId: string,
  body: IssueOrdenCompraBody,
): Promise<OrdenCompra> {
  if (USE_MOCKS) return mock.mockIssueOrdenCompra(tenantId, ocId, body);

  const row = await finanzasFetch<Record<string, unknown>>(tenantId, `/ordenes-compra/${ocId}/issue`, {
    method: "POST",
    body: JSON.stringify({
      actor_id: body.actor_id ?? "dashboard-user",
      notes: body.justification,
    }),
  });
  return toOrdenCompra(row);
}

export async function cancelOrdenCompra(
  tenantId: string,
  ocId: string,
  body: CancelOrdenCompraBody,
): Promise<OrdenCompra> {
  if (USE_MOCKS) return mock.mockCancelOrdenCompra(tenantId, ocId, body);

  const row = await finanzasFetch<Record<string, unknown>>(tenantId, `/ordenes-compra/${ocId}/cancel`, {
    method: "POST",
    body: JSON.stringify({
      actor_id: body.actor_id ?? "dashboard-user",
      reason: body.justification,
    }),
  });
  return toOrdenCompra(row);
}

export async function closeOrdenCompra(
  tenantId: string,
  ocId: string,
  body: CloseOrdenCompraBody,
): Promise<OrdenCompra> {
  if (USE_MOCKS) return mock.mockCloseOrdenCompra(tenantId, ocId, body);

  const row = await finanzasFetch<Record<string, unknown>>(tenantId, `/ordenes-compra/${ocId}/close`, {
    method: "POST",
    body: JSON.stringify({
      actor_id: body.actor_id ?? "dashboard-user",
    }),
  });
  return toOrdenCompra(row);
}

export async function deleteOrdenCompra(tenantId: string, ocId: string): Promise<void> {
  if (USE_MOCKS) return mock.mockDeleteOrdenCompra(tenantId, ocId);
  await finanzasFetch<void>(tenantId, `/ordenes-compra/${ocId}`, { method: "DELETE" });
}

// ── Pagos (API) ──────────────────────────────────────────────────────────

export async function listPagos(
  tenantId: string,
  projectId: string,
  filters?: FinanzasListFilters,
): Promise<PaginatedResponse<Pago>> {
  if (USE_MOCKS) return mock.mockListPagos(tenantId, projectId, filters);

  const raw = await finanzasFetch<{ items: unknown[]; total: number; limit?: number; offset?: number }>(
    tenantId,
    `/${projectId}/pagos${listQuery(filters)}`,
  );
  let page = toPaginated(raw, toPago);
  if (filters?.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    page = {
      ...page,
      items: page.items.filter((p) => JSON.stringify(p).toLowerCase().includes(q)),
      total: page.items.length,
    };
  }
  return page;
}

export async function getPago(tenantId: string, pagoId: string): Promise<Pago | null> {
  if (USE_MOCKS) return mock.mockGetPago(tenantId, pagoId);
  try {
    const row = await finanzasFetch<Record<string, unknown>>(tenantId, `/pagos/${pagoId}`);
    return toPago(row);
  } catch (e) {
    if (e instanceof FinanzasApiError && e.status === 404) return null;
    throw e;
  }
}

export async function createPago(
  tenantId: string,
  projectId: string,
  payload: CreatePagoPayload,
): Promise<Pago> {
  if (USE_MOCKS) return mock.mockCreatePago(tenantId, projectId, payload);

  const row = await finanzasFetch<Record<string, unknown>>(tenantId, `/${projectId}/pagos`, {
    method: "POST",
    body: JSON.stringify(toCreatePagoBody(payload)),
  });
  return toPago(row);
}

export async function updatePago(
  tenantId: string,
  pagoId: string,
  payload: UpdatePagoPayload,
): Promise<Pago> {
  if (USE_MOCKS) return mock.mockUpdatePago(tenantId, pagoId, payload);

  const body: Record<string, unknown> = {};
  if (payload.fecha_pago != null) body.fecha_pago = payload.fecha_pago;
  if (payload.metodo_pago != null) body.metodo_pago = payload.metodo_pago;
  if (payload.referencia != null) body.referencia_bancaria = payload.referencia;
  if (payload.monto_usd != null) body.monto_pagado_usd = payload.monto_usd;

  const row = await finanzasFetch<Record<string, unknown>>(tenantId, `/pagos/${pagoId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return toPago(row);
}

export async function confirmPago(
  tenantId: string,
  pagoId: string,
  body: ConfirmPagoBody,
): Promise<Pago> {
  if (USE_MOCKS) return mock.mockConfirmPago(tenantId, pagoId, body);

  const row = await finanzasFetch<Record<string, unknown>>(tenantId, `/pagos/${pagoId}/confirm`, {
    method: "POST",
    body: JSON.stringify({
      actor_id: body.actor_id ?? "dashboard-user",
      referencia: body.referencia,
      notes: body.referencia,
    }),
  });
  return toPago(row);
}

export async function reversePago(
  tenantId: string,
  pagoId: string,
  body: ReversePagoBody,
): Promise<Pago> {
  if (USE_MOCKS) return mock.mockReversePago(tenantId, pagoId, body);

  const row = await finanzasFetch<Record<string, unknown>>(tenantId, `/pagos/${pagoId}/reverse`, {
    method: "POST",
    body: JSON.stringify({
      actor_id: body.actor_id ?? "dashboard-user",
      reason: body.reason,
    }),
  });
  return toPago(row);
}

export async function deletePago(tenantId: string, pagoId: string): Promise<void> {
  if (USE_MOCKS) return mock.mockDeletePago(tenantId, pagoId);
  await finanzasFetch<void>(tenantId, `/pagos/${pagoId}`, { method: "DELETE" });
}

// ── Deals (partial API — list + create only) ───────────────────────────────

export async function listDeals(
  tenantId: string,
  projectId: string,
  filters?: FinanzasListFilters,
): Promise<PaginatedResponse<Deal>> {
  if (USE_MOCKS) return mock.mockListDeals(tenantId, projectId, filters);

  const rows = await finanzasFetch<unknown[]>(tenantId, `/${projectId}/deals`);
  let items = (rows ?? []).map((row) =>
    toDeal(row as Record<string, unknown>, { tenant_id: tenantId, project_id: projectId }),
  );
  items = filterBySearch(items, filters?.search);
  return {
    items,
    total: items.length,
    page: 1,
    page_size: items.length || filters?.page_size || 100,
  };
}

export async function getDeal(tenantId: string, dealId: string): Promise<Deal | null> {
  // TODO[deals-backend]: no GET /deals/{id} in prod — mock fallback
  if (USE_MOCKS) return mock.mockGetDeal(tenantId, dealId);
  return mock.mockGetDeal(tenantId, dealId);
}

export async function createDeal(
  tenantId: string,
  projectId: string,
  payload: CreateDealPayload,
): Promise<Deal> {
  if (USE_MOCKS) return mock.mockCreateDeal(tenantId, projectId, payload);

  const row = await finanzasFetch<Record<string, unknown>>(tenantId, `/${projectId}/deals`, {
    method: "POST",
    body: JSON.stringify(toCreateDealBody(payload)),
  });
  return toDeal(row, {
    tenant_id: tenantId,
    project_id: projectId,
    titulo: payload.titulo,
    contraparte: payload.contraparte,
    monto_usd: payload.monto_usd,
    fecha_inicio: payload.fecha_inicio,
  });
}

export async function updateDeal(
  tenantId: string,
  dealId: string,
  payload: UpdateDealPayload,
): Promise<Deal> {
  // TODO[deals-backend]: no PATCH /deals/{id} in prod
  return mock.mockUpdateDeal(tenantId, dealId, payload);
}

export async function closeDeal(
  tenantId: string,
  dealId: string,
  body: CloseDealBody,
): Promise<Deal> {
  // TODO[deals-backend]: no POST /deals/{id}/close in prod
  return mock.mockCloseDeal(tenantId, dealId, body);
}

export async function deleteDeal(tenantId: string, dealId: string): Promise<void> {
  // TODO[deals-backend]: no DELETE /deals/{id} in prod
  return mock.mockDeleteDeal(tenantId, dealId);
}

// ── Eventos económicos (API) ─────────────────────────────────────────────

export async function listEventosEconomicos(
  tenantId: string,
  projectId: string,
  filters?: FinanzasListFilters,
): Promise<PaginatedResponse<EconomicEvent>> {
  if (USE_MOCKS) return mock.mockListEventosEconomicos(tenantId, projectId, filters);

  const params = new URLSearchParams();
  const limit = filters?.page_size ?? 100;
  const offset = filters?.page ? (filters.page - 1) * limit : 0;
  params.set("limit", String(limit));
  params.set("offset", String(offset));
  if (filters?.date_from) params.set("fecha_desde", filters.date_from);
  if (filters?.date_to) params.set("fecha_hasta", filters.date_to);
  const q = params.toString();

  const raw = await finanzasFetch<{ items: unknown[]; total: number; limit?: number; offset?: number }>(
    tenantId,
    `/${projectId}/eventos-economicos${q ? `?${q}` : ""}`,
  );
  return toPaginated(raw, toEconomicEvent);
}

export async function getEventoEconomico(
  tenantId: string,
  eventoId: string,
): Promise<EconomicEvent | null> {
  if (USE_MOCKS) return mock.mockGetEventoEconomico(tenantId, eventoId);
  try {
    const row = await finanzasFetch<Record<string, unknown>>(tenantId, `/eventos-economicos/${eventoId}`);
    return toEconomicEvent(row);
  } catch (e) {
    if (e instanceof FinanzasApiError && e.status === 404) return null;
    throw e;
  }
}

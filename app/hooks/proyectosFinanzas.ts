/**
 * Proyectos Finanzas hooks — facturas / pagos / eventos wired to production API.
 * Cotizaciones, OC, budget, deals remain mock-backed until WS-B merges (see TODO[WS-B]).
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

// ── Budget / overview (mock until backend KPI endpoints) ─────────────────

export async function getFinanceOverview(tenantId: string, projectId: string): Promise<FinanceOverview> {
  return mock.mockGetFinanceOverview(tenantId, projectId);
}

export async function getBudget(tenantId: string, projectId: string): Promise<BudgetSnapshot> {
  return mock.mockGetBudget(tenantId, projectId);
}

export async function getBudgetVariance(tenantId: string, projectId: string): Promise<BudgetVarianceReport> {
  return mock.mockGetBudgetVariance(tenantId, projectId);
}

export async function updateBudget(
  tenantId: string,
  projectId: string,
  payload: UpdateBudgetPayload,
): Promise<BudgetSnapshot> {
  return mock.mockUpdateBudget(tenantId, projectId, payload);
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

// ── Cotizaciones / OC — TODO[WS-B] ───────────────────────────────────────

export async function listCotizaciones(
  tenantId: string,
  projectId: string,
  filters?: FinanzasListFilters,
): Promise<PaginatedResponse<Cotizacion>> {
  // TODO[WS-B]: switch to real API when phase2/backend-procurement merges
  return mock.mockListCotizaciones(tenantId, projectId, filters);
}

export async function getCotizacion(tenantId: string, cotizacionId: string): Promise<Cotizacion | null> {
  return mock.mockGetCotizacion(tenantId, cotizacionId);
}

export async function createCotizacion(
  tenantId: string,
  projectId: string,
  payload: CreateCotizacionPayload,
): Promise<Cotizacion> {
  return mock.mockCreateCotizacion(tenantId, projectId, payload);
}

export async function updateCotizacion(
  tenantId: string,
  cotizacionId: string,
  payload: UpdateCotizacionPayload,
): Promise<Cotizacion> {
  return mock.mockUpdateCotizacion(tenantId, cotizacionId, payload);
}

export async function approveCotizacion(
  tenantId: string,
  cotizacionId: string,
  body: ApprovalBody,
): Promise<Cotizacion> {
  return mock.mockApproveCotizacion(tenantId, cotizacionId, body);
}

export async function rejectCotizacion(
  tenantId: string,
  cotizacionId: string,
  body: RejectBody,
): Promise<Cotizacion> {
  return mock.mockRejectCotizacion(tenantId, cotizacionId, body);
}

export async function convertCotizacionToPO(
  tenantId: string,
  cotizacionId: string,
  body: ConvertCotizacionToPOBody,
): Promise<OrdenCompra> {
  return mock.mockConvertCotizacionToPO(tenantId, cotizacionId, body);
}

export async function deleteCotizacion(tenantId: string, cotizacionId: string): Promise<void> {
  return mock.mockDeleteCotizacion(tenantId, cotizacionId);
}

export async function listOrdenesCompra(
  tenantId: string,
  projectId: string,
  filters?: FinanzasListFilters,
): Promise<PaginatedResponse<OrdenCompra>> {
  // TODO[WS-B]: switch to real API when phase2/backend-procurement merges
  return mock.mockListOrdenesCompra(tenantId, projectId, filters);
}

export async function getOrdenCompra(tenantId: string, ocId: string): Promise<OrdenCompra | null> {
  return mock.mockGetOrdenCompra(tenantId, ocId);
}

export async function createOrdenCompra(
  tenantId: string,
  projectId: string,
  payload: CreateOrdenCompraPayload,
): Promise<OrdenCompra> {
  return mock.mockCreateOrdenCompra(tenantId, projectId, payload);
}

export async function updateOrdenCompra(
  tenantId: string,
  ocId: string,
  payload: UpdateOrdenCompraPayload,
): Promise<OrdenCompra> {
  return mock.mockUpdateOrdenCompra(tenantId, ocId, payload);
}

export async function issueOrdenCompra(
  tenantId: string,
  ocId: string,
  body: IssueOrdenCompraBody,
): Promise<OrdenCompra> {
  return mock.mockIssueOrdenCompra(tenantId, ocId, body);
}

export async function cancelOrdenCompra(
  tenantId: string,
  ocId: string,
  body: CancelOrdenCompraBody,
): Promise<OrdenCompra> {
  return mock.mockCancelOrdenCompra(tenantId, ocId, body);
}

export async function closeOrdenCompra(
  tenantId: string,
  ocId: string,
  body: CloseOrdenCompraBody,
): Promise<OrdenCompra> {
  return mock.mockCloseOrdenCompra(tenantId, ocId, body);
}

export async function deleteOrdenCompra(tenantId: string, ocId: string): Promise<void> {
  return mock.mockDeleteOrdenCompra(tenantId, ocId);
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

// ── Deals — TODO[WS-B] (legacy array endpoint differs from finanzas contract) ─

export async function listDeals(
  tenantId: string,
  projectId: string,
  filters?: FinanzasListFilters,
): Promise<PaginatedResponse<Deal>> {
  // TODO[WS-B]: switch to real API when phase2/backend-procurement merges
  return mock.mockListDeals(tenantId, projectId, filters);
}

export async function getDeal(tenantId: string, dealId: string): Promise<Deal | null> {
  return mock.mockGetDeal(tenantId, dealId);
}

export async function createDeal(
  tenantId: string,
  projectId: string,
  payload: CreateDealPayload,
): Promise<Deal> {
  return mock.mockCreateDeal(tenantId, projectId, payload);
}

export async function updateDeal(
  tenantId: string,
  dealId: string,
  payload: UpdateDealPayload,
): Promise<Deal> {
  return mock.mockUpdateDeal(tenantId, dealId, payload);
}

export async function closeDeal(
  tenantId: string,
  dealId: string,
  body: CloseDealBody,
): Promise<Deal> {
  return mock.mockCloseDeal(tenantId, dealId, body);
}

export async function deleteDeal(tenantId: string, dealId: string): Promise<void> {
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

/**
 * In-memory mock API for Proyectos Finanzas.
 * Replace calls in useProyectos.ts with real fetch when backend is ready.
 */

import { cloneFinanzasSeed, MOCK_TENANT_ID } from "@/lib/mocks/finanzas";
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
  Deal,
  EconomicEvent,
  Factura,
  FinanzasListFilters,
  FinanceOverview,
  IssueOrdenCompraBody,
  OrdenCompra,
  PaginatedResponse,
  Pago,
  RejectBody,
  ReversePagoBody,
  UpdateBudgetPayload,
  UpdateCotizacionPayload,
  UpdateDealPayload,
  UpdateFacturaPayload,
  UpdateOrdenCompraPayload,
  UpdatePagoPayload,
} from "@/types/finanzas";

const stores = new Map<string, ReturnType<typeof cloneFinanzasSeed>>();

function storeKey(tenantId: string, projectId: string) {
  return `${tenantId}:${projectId}`;
}

function getStore(tenantId: string, projectId: string) {
  const key = storeKey(tenantId, projectId);
  if (!stores.has(key)) stores.set(key, cloneFinanzasSeed(projectId));
  return stores.get(key)!;
}

function delay<T>(value: T, ms = 120): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function now() {
  return new Date().toISOString();
}

function uuid() {
  return crypto.randomUUID();
}

function paginate<T>(items: T[], filters?: FinanzasListFilters): PaginatedResponse<T> {
  let rows = [...items];
  const search = filters?.search?.trim().toLowerCase();
  if (search) {
    rows = rows.filter((row) => JSON.stringify(row).toLowerCase().includes(search));
  }
  if (filters?.status?.length) {
    const statuses = new Set(filters.status);
    rows = rows.filter((row) => {
      const status = (row as { status?: string; validation_status?: string }).status
        ?? (row as { validation_status?: string }).validation_status;
      return status ? statuses.has(status) : false;
    });
  }
  const sortBy = filters?.sort_by;
  if (sortBy) {
    const dir = filters.sort_dir === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      const av = (a as Record<string, unknown>)[sortBy];
      const bv = (b as Record<string, unknown>)[sortBy];
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av ?? "").localeCompare(String(bv ?? "")) * dir;
    });
  }
  const page = filters?.page ?? 1;
  const pageSize = filters?.page_size ?? 20;
  const start = (page - 1) * pageSize;
  return { items: rows.slice(start, start + pageSize), total: rows.length, page, page_size: pageSize };
}

function pushEvent(
  store: ReturnType<typeof getStore>,
  projectId: string,
  tenantId: string,
  event: Omit<EconomicEvent, "id" | "created_at" | "tenant_id" | "project_id">,
) {
  store.eventos.unshift({
    ...event,
    id: uuid(),
    tenant_id: tenantId,
    project_id: projectId,
    created_at: now(),
  });
}

function validateFactura(f: Factura): Factura {
  const reasons: string[] = [];
  if (f.monto_total_usd <= 0) reasons.push("MONTO_INVALIDO");
  if (f.orden_compra_id) {
    const oc = getStore(f.tenant_id, f.project_id).ordenes.find((o) => o.id === f.orden_compra_id);
    if (oc && f.monto_total_usd > oc.monto_total_usd) reasons.push("MONTO_DECLARADO_NO_COINCIDE");
  }
  const status: Factura["validation_status"] = reasons.length ? "needs_pm_review" : "received";
  return { ...f, validation_status: status, validation_reason_codes: reasons, updated_at: now() };
}

// --- Budget ---

export async function mockGetBudget(tenantId: string, projectId: string): Promise<BudgetSnapshot> {
  return delay(getStore(tenantId, projectId).budget);
}

export async function mockGetBudgetVariance(tenantId: string, projectId: string): Promise<BudgetVarianceReport> {
  return delay(getStore(tenantId, projectId).variance);
}

export async function mockUpdateBudget(
  tenantId: string,
  projectId: string,
  payload: UpdateBudgetPayload,
): Promise<BudgetSnapshot> {
  const store = getStore(tenantId, projectId);
  store.budget = {
    ...store.budget,
    envelope_usd: payload.envelope_usd ?? store.budget.envelope_usd,
    capex_usd: payload.capex_usd ?? store.budget.capex_usd,
    opex_usd: payload.opex_usd ?? store.budget.opex_usd,
    contingencia_usd: payload.contingencia_usd ?? store.budget.contingencia_usd,
    updated_at: now(),
  };
  return delay(store.budget);
}

export async function mockGetFinanceOverview(tenantId: string, projectId: string): Promise<FinanceOverview> {
  const store = getStore(tenantId, projectId);
  const facturado = store.facturas
    .filter((f) => f.validation_status === "approved")
    .reduce((s, f) => s + f.monto_total_usd, 0);
  const pagado = store.pagos.filter((p) => p.status === "paid").reduce((s, p) => s + p.monto_usd, 0);
  const comprometido = store.ordenes
    .filter((o) => o.status === "issued" || o.status === "accepted")
    .reduce((s, o) => s + o.monto_total_usd, 0);
  const planned = store.budget.envelope_usd;
  const variance = planned > 0 ? ((comprometido - planned) / planned) * 100 : 0;

  return delay({
    kpis: {
      presupuesto_total_usd: store.budget.envelope_usd,
      capex_aprobado_usd: store.budget.capex_usd,
      opex_aprobado_usd: store.budget.opex_usd,
      comprometido_usd: comprometido,
      facturado_usd: facturado,
      pagado_usd: pagado,
      saldo_pendiente_usd: facturado - pagado,
      variance_pct: Math.round(variance * 10) / 10,
    },
    recent_events: store.eventos.slice(0, 10),
    alerts: [
      {
        id: "alert-1",
        severity: "warning" as const,
        title: "Factura pendiente de revisión",
        description: "Revisa facturas en needs_pm_review antes de pagar.",
      },
      {
        id: "alert-2",
        severity: "info" as const,
        title: "Datos mock (Fase 2)",
        description: "Frontend financiero operativo — conectar API real en merge WS-A/B.",
      },
    ],
  });
}

// --- Cotizaciones ---

export async function mockListCotizaciones(
  tenantId: string,
  projectId: string,
  filters?: FinanzasListFilters,
): Promise<PaginatedResponse<Cotizacion>> {
  return delay(paginate(getStore(tenantId, projectId).cotizaciones, filters));
}

export async function mockGetCotizacion(tenantId: string, cotizacionId: string): Promise<Cotizacion | null> {
  for (const store of stores.values()) {
    const found = store.cotizaciones.find((c) => c.id === cotizacionId);
    if (found) return delay(found);
  }
  return delay(null);
}

export async function mockCreateCotizacion(
  tenantId: string,
  projectId: string,
  payload: CreateCotizacionPayload,
): Promise<Cotizacion> {
  const store = getStore(tenantId, projectId);
  const row: Cotizacion = {
    ...payload,
    id: uuid(),
    tenant_id: tenantId,
    project_id: projectId,
    status: payload.status ?? "received",
    created_at: now(),
    updated_at: now(),
  };
  store.cotizaciones.unshift(row);
  return delay(row);
}

export async function mockUpdateCotizacion(
  tenantId: string,
  cotizacionId: string,
  payload: UpdateCotizacionPayload,
): Promise<Cotizacion> {
  const row = await mockGetCotizacion(tenantId, cotizacionId);
  if (!row) throw new Error("Cotización no encontrada");
  const store = getStore(tenantId, row.project_id);
  const idx = store.cotizaciones.findIndex((c) => c.id === cotizacionId);
  store.cotizaciones[idx] = { ...row, ...payload, updated_at: now() };
  return delay(store.cotizaciones[idx]!);
}

export async function mockApproveCotizacion(
  tenantId: string,
  cotizacionId: string,
  body: ApprovalBody,
): Promise<Cotizacion> {
  const row = await mockUpdateCotizacion(tenantId, cotizacionId, { status: "approved" });
  pushEvent(getStore(tenantId, row.project_id), row.project_id, tenantId, {
    event_type: "QUOTE_APPROVED",
    entity_type: "cotizacion",
    entity_id: row.id,
    amount_usd: row.monto_total_usd,
    currency: row.currency,
    actor_id: body.actor_id ?? "dashboard-user",
    description: `Cotización ${row.numero_cotizacion} aprobada: ${body.justification}`,
    occurred_at: now(),
    metadata: { justification: body.justification },
  });
  return row;
}

export async function mockRejectCotizacion(
  tenantId: string,
  cotizacionId: string,
  body: RejectBody,
): Promise<Cotizacion> {
  const row = await mockUpdateCotizacion(tenantId, cotizacionId, { status: "rejected" });
  pushEvent(getStore(tenantId, row.project_id), row.project_id, tenantId, {
    event_type: "QUOTE_REJECTED",
    entity_type: "cotizacion",
    entity_id: row.id,
    amount_usd: row.monto_total_usd,
    currency: row.currency,
    actor_id: body.actor_id ?? "dashboard-user",
    description: `Cotización ${row.numero_cotizacion} rechazada: ${body.justification}`,
    occurred_at: now(),
  });
  return row;
}

export async function mockConvertCotizacionToPO(
  tenantId: string,
  cotizacionId: string,
  body: ConvertCotizacionToPOBody,
): Promise<OrdenCompra> {
  const cot = await mockGetCotizacion(tenantId, cotizacionId);
  if (!cot) throw new Error("Cotización no encontrada");
  const oc = await mockCreateOrdenCompra(tenantId, cot.project_id, {
    tenant_id: tenantId,
    project_id: cot.project_id,
    cotizacion_id: cot.id,
    contratista_id: cot.contratista_id,
    contratista_nombre: cot.contratista_nombre,
    monto_total_usd: body.monto_total_usd ?? cot.monto_total_usd,
    currency: cot.currency,
    fecha_emision: now().slice(0, 10),
    fecha_entrega_esperada: body.fecha_entrega_esperada,
    line_items: cot.line_items,
    notas: body.notas ?? cot.notas,
    status: "draft",
    numero_oc: body.numero_oc,
  });
  await mockUpdateCotizacion(tenantId, cotizacionId, { status: "converted_to_po" });
  return oc;
}

export async function mockDeleteCotizacion(tenantId: string, cotizacionId: string): Promise<void> {
  const row = await mockGetCotizacion(tenantId, cotizacionId);
  if (!row) return;
  const store = getStore(tenantId, row.project_id);
  store.cotizaciones = store.cotizaciones.filter((c) => c.id !== cotizacionId);
  await delay(undefined);
}

// --- Ordenes de Compra ---

export async function mockListOrdenesCompra(
  tenantId: string,
  projectId: string,
  filters?: FinanzasListFilters,
): Promise<PaginatedResponse<OrdenCompra>> {
  return delay(paginate(getStore(tenantId, projectId).ordenes, filters));
}

export async function mockGetOrdenCompra(tenantId: string, ocId: string): Promise<OrdenCompra | null> {
  for (const store of stores.values()) {
    const found = store.ordenes.find((o) => o.id === ocId);
    if (found) return delay(found);
  }
  return delay(null);
}

export async function mockCreateOrdenCompra(
  tenantId: string,
  projectId: string,
  payload: CreateOrdenCompraPayload,
): Promise<OrdenCompra> {
  const store = getStore(tenantId, projectId);
  const count = store.ordenes.length + 1;
  const row: OrdenCompra = {
    ...payload,
    id: uuid(),
    tenant_id: tenantId,
    project_id: projectId,
    numero_oc: payload.numero_oc ?? `OC-${new Date().getFullYear()}-${String(count).padStart(3, "0")}`,
    status: payload.status ?? "draft",
    created_at: now(),
    updated_at: now(),
  };
  store.ordenes.unshift(row);
  return delay(row);
}

export async function mockUpdateOrdenCompra(
  tenantId: string,
  ocId: string,
  payload: UpdateOrdenCompraPayload,
): Promise<OrdenCompra> {
  const row = await mockGetOrdenCompra(tenantId, ocId);
  if (!row) throw new Error("OC no encontrada");
  const store = getStore(tenantId, row.project_id);
  const idx = store.ordenes.findIndex((o) => o.id === ocId);
  store.ordenes[idx] = { ...row, ...payload, updated_at: now() };
  return delay(store.ordenes[idx]!);
}

export async function mockIssueOrdenCompra(
  tenantId: string,
  ocId: string,
  body: IssueOrdenCompraBody,
): Promise<OrdenCompra> {
  const row = await mockUpdateOrdenCompra(tenantId, ocId, { status: "issued" });
  pushEvent(getStore(tenantId, row.project_id), row.project_id, tenantId, {
    event_type: "PO_ISSUED",
    entity_type: "orden_compra",
    entity_id: row.id,
    amount_usd: row.monto_total_usd,
    currency: row.currency,
    actor_id: body.actor_id ?? "dashboard-user",
    description: `OC ${row.numero_oc} emitida`,
    occurred_at: now(),
  });
  return row;
}

export async function mockCancelOrdenCompra(
  tenantId: string,
  ocId: string,
  body: CancelOrdenCompraBody,
): Promise<OrdenCompra> {
  const row = await mockUpdateOrdenCompra(tenantId, ocId, { status: "cancelled", notas: body.justification });
  pushEvent(getStore(tenantId, row.project_id), row.project_id, tenantId, {
    event_type: "PO_CANCELLED",
    entity_type: "orden_compra",
    entity_id: row.id,
    amount_usd: row.monto_total_usd,
    currency: row.currency,
    actor_id: body.actor_id ?? "dashboard-user",
    description: body.justification,
    occurred_at: now(),
  });
  return row;
}

export async function mockCloseOrdenCompra(
  tenantId: string,
  ocId: string,
  body: CloseOrdenCompraBody,
): Promise<OrdenCompra> {
  const row = await mockUpdateOrdenCompra(tenantId, ocId, { status: "closed", notas: body.justification });
  pushEvent(getStore(tenantId, row.project_id), row.project_id, tenantId, {
    event_type: "PO_CLOSED",
    entity_type: "orden_compra",
    entity_id: row.id,
    amount_usd: row.monto_total_usd,
    currency: row.currency,
    actor_id: body.actor_id ?? "dashboard-user",
    description: body.justification,
    occurred_at: now(),
  });
  return row;
}

export async function mockDeleteOrdenCompra(tenantId: string, ocId: string): Promise<void> {
  const row = await mockGetOrdenCompra(tenantId, ocId);
  if (!row) return;
  const store = getStore(tenantId, row.project_id);
  store.ordenes = store.ordenes.filter((o) => o.id !== ocId);
  await delay(undefined);
}

// --- Facturas ---

export async function mockListFacturas(
  tenantId: string,
  projectId: string,
  filters?: FinanzasListFilters,
): Promise<PaginatedResponse<Factura>> {
  return delay(paginate(getStore(tenantId, projectId).facturas, filters));
}

export async function mockGetFactura(tenantId: string, facturaId: string): Promise<Factura | null> {
  for (const store of stores.values()) {
    const found = store.facturas.find((f) => f.id === facturaId);
    if (found) return delay(found);
  }
  return delay(null);
}

export async function mockCreateFactura(
  tenantId: string,
  projectId: string,
  payload: CreateFacturaPayload,
): Promise<Factura> {
  const store = getStore(tenantId, projectId);
  let row: Factura = {
    ...payload,
    id: uuid(),
    tenant_id: tenantId,
    project_id: projectId,
    validation_status: payload.validation_status ?? "draft",
    payment_status: "unpaid",
    validation_reason_codes: [],
    monto_pagado_usd: 0,
    saldo_pendiente_usd: payload.monto_total_usd,
    created_at: now(),
    updated_at: now(),
  };
  row = validateFactura(row);
  store.facturas.unshift(row);
  pushEvent(store, projectId, tenantId, {
    event_type: "INVOICE_VALIDATED",
    entity_type: "factura",
    entity_id: row.id,
    amount_usd: row.monto_total_usd,
    currency: row.currency,
    description: `Factura ${row.numero_factura} validada (${row.validation_status})`,
    occurred_at: now(),
    metadata: { reason_codes: row.validation_reason_codes },
  });
  return delay(row);
}

export async function mockUpdateFactura(
  tenantId: string,
  facturaId: string,
  payload: UpdateFacturaPayload,
): Promise<Factura> {
  const row = await mockGetFactura(tenantId, facturaId);
  if (!row) throw new Error("Factura no encontrada");
  const store = getStore(tenantId, row.project_id);
  const idx = store.facturas.findIndex((f) => f.id === facturaId);
  store.facturas[idx] = { ...row, ...payload, updated_at: now() };
  return delay(store.facturas[idx]!);
}

export async function mockApproveFactura(
  tenantId: string,
  facturaId: string,
  body: ApprovalBody,
): Promise<Factura> {
  const row = await mockUpdateFactura(tenantId, facturaId, {
    validation_status: "approved",
    validation_reason_codes: [],
  });
  pushEvent(getStore(tenantId, row.project_id), row.project_id, tenantId, {
    event_type: "INVOICE_APPROVED",
    entity_type: "factura",
    entity_id: row.id,
    amount_usd: row.monto_total_usd,
    currency: row.currency,
    actor_id: body.actor_id ?? "dashboard-user",
    description: body.justification,
    occurred_at: now(),
  });
  return row;
}

export async function mockRejectFactura(
  tenantId: string,
  facturaId: string,
  body: RejectBody,
): Promise<Factura> {
  const row = await mockUpdateFactura(tenantId, facturaId, {
    validation_status: "rejected",
    validation_reason_codes: body.reason_codes ?? ["REJECTED_BY_PM"],
  });
  pushEvent(getStore(tenantId, row.project_id), row.project_id, tenantId, {
    event_type: "INVOICE_REJECTED",
    entity_type: "factura",
    entity_id: row.id,
    amount_usd: row.monto_total_usd,
    currency: row.currency,
    actor_id: body.actor_id ?? "dashboard-user",
    description: body.justification,
    occurred_at: now(),
  });
  return row;
}

export async function mockDeleteFactura(tenantId: string, facturaId: string): Promise<void> {
  const row = await mockGetFactura(tenantId, facturaId);
  if (!row) return;
  const store = getStore(tenantId, row.project_id);
  store.facturas = store.facturas.filter((f) => f.id !== facturaId);
  await delay(undefined);
}

// --- Pagos ---

export async function mockListPagos(
  tenantId: string,
  projectId: string,
  filters?: FinanzasListFilters,
): Promise<PaginatedResponse<Pago>> {
  return delay(paginate(getStore(tenantId, projectId).pagos, filters));
}

export async function mockGetPago(tenantId: string, pagoId: string): Promise<Pago | null> {
  for (const store of stores.values()) {
    const found = store.pagos.find((p) => p.id === pagoId);
    if (found) return delay(found);
  }
  return delay(null);
}

export async function mockCreatePago(
  tenantId: string,
  projectId: string,
  payload: CreatePagoPayload,
): Promise<Pago> {
  const store = getStore(tenantId, projectId);
  const factura = store.facturas.find((f) => f.id === payload.factura_id);
  if (!factura) throw new Error("Factura no encontrada");
  if (factura.validation_status !== "approved") throw new Error("La factura debe estar aprobada");
  if (payload.monto_usd > factura.saldo_pendiente_usd) {
    throw new Error("El monto excede el saldo pendiente de la factura (sobrepago)");
  }
  const count = store.pagos.length + 1;
  const row: Pago = {
    ...payload,
    id: uuid(),
    tenant_id: tenantId,
    project_id: projectId,
    numero_pago: `PAG-${new Date().getFullYear()}-${String(count).padStart(3, "0")}`,
    status: payload.status ?? "pending",
    created_at: now(),
    updated_at: now(),
  };
  store.pagos.unshift(row);
  return delay(row);
}

export async function mockUpdatePago(
  tenantId: string,
  pagoId: string,
  payload: UpdatePagoPayload,
): Promise<Pago> {
  const row = await mockGetPago(tenantId, pagoId);
  if (!row) throw new Error("Pago no encontrado");
  const store = getStore(tenantId, row.project_id);
  const idx = store.pagos.findIndex((p) => p.id === pagoId);
  store.pagos[idx] = { ...row, ...payload, updated_at: now() };
  return delay(store.pagos[idx]!);
}

export async function mockConfirmPago(
  tenantId: string,
  pagoId: string,
  body: ConfirmPagoBody,
): Promise<Pago> {
  const row = await mockGetPago(tenantId, pagoId);
  if (!row) throw new Error("Pago no encontrado");
  const store = getStore(tenantId, row.project_id);
  const factura = store.facturas.find((f) => f.id === row.factura_id);
  if (factura && row.monto_usd > factura.saldo_pendiente_usd) {
    throw new Error("Sobrepago: el monto supera el saldo pendiente");
  }
  const updated = await mockUpdatePago(tenantId, pagoId, {
    status: "paid",
    fecha_pago: now().slice(0, 10),
    referencia: body.referencia,
    actor_id: body.actor_id ?? "dashboard-user",
  });
  if (factura) {
    factura.monto_pagado_usd += row.monto_usd;
    factura.saldo_pendiente_usd = Math.max(0, factura.monto_total_usd - factura.monto_pagado_usd);
    factura.payment_status =
      factura.saldo_pendiente_usd === 0 ? "paid" : factura.monto_pagado_usd > 0 ? "partial" : "unpaid";
    factura.updated_at = now();
  }
  pushEvent(store, row.project_id, tenantId, {
    event_type: "PAYMENT_CONFIRMED",
    entity_type: "pago",
    entity_id: row.id,
    amount_usd: row.monto_usd,
    currency: row.currency,
    actor_id: body.actor_id ?? "dashboard-user",
    description: `Pago ${row.numero_pago} confirmado`,
    occurred_at: now(),
  });
  return updated;
}

export async function mockReversePago(
  tenantId: string,
  pagoId: string,
  body: ReversePagoBody,
): Promise<Pago> {
  const row = await mockGetPago(tenantId, pagoId);
  if (!row) throw new Error("Pago no encontrado");
  const store = getStore(tenantId, row.project_id);
  const updated = await mockUpdatePago(tenantId, pagoId, {
    status: "reversed",
    reverse_reason: body.reason,
    actor_id: body.actor_id ?? "dashboard-user",
  });
  const factura = store.facturas.find((f) => f.id === row.factura_id);
  if (factura && row.status === "paid") {
    factura.monto_pagado_usd = Math.max(0, factura.monto_pagado_usd - row.monto_usd);
    factura.saldo_pendiente_usd = factura.monto_total_usd - factura.monto_pagado_usd;
    factura.payment_status = factura.monto_pagado_usd > 0 ? "partial" : "unpaid";
  }
  pushEvent(store, row.project_id, tenantId, {
    event_type: "PAYMENT_REVERSED",
    entity_type: "pago",
    entity_id: row.id,
    amount_usd: row.monto_usd,
    currency: row.currency,
    actor_id: body.actor_id ?? "dashboard-user",
    description: body.reason,
    occurred_at: now(),
  });
  return updated;
}

export async function mockDeletePago(tenantId: string, pagoId: string): Promise<void> {
  const row = await mockGetPago(tenantId, pagoId);
  if (!row) return;
  const store = getStore(tenantId, row.project_id);
  store.pagos = store.pagos.filter((p) => p.id !== pagoId);
  await delay(undefined);
}

// --- Deals ---

export async function mockListDeals(
  tenantId: string,
  projectId: string,
  filters?: FinanzasListFilters,
): Promise<PaginatedResponse<Deal>> {
  return delay(paginate(getStore(tenantId, projectId).deals, filters));
}

export async function mockGetDeal(tenantId: string, dealId: string): Promise<Deal | null> {
  for (const store of stores.values()) {
    const found = store.deals.find((d) => d.id === dealId);
    if (found) return delay(found);
  }
  return delay(null);
}

export async function mockCreateDeal(
  tenantId: string,
  projectId: string,
  payload: CreateDealPayload,
): Promise<Deal> {
  const store = getStore(tenantId, projectId);
  const row: Deal = {
    ...payload,
    id: uuid(),
    tenant_id: tenantId,
    project_id: projectId,
    status: payload.status ?? "open",
    created_at: now(),
    updated_at: now(),
  };
  store.deals.unshift(row);
  return delay(row);
}

export async function mockUpdateDeal(
  tenantId: string,
  dealId: string,
  payload: UpdateDealPayload,
): Promise<Deal> {
  const row = await mockGetDeal(tenantId, dealId);
  if (!row) throw new Error("Deal no encontrado");
  const store = getStore(tenantId, row.project_id);
  const idx = store.deals.findIndex((d) => d.id === dealId);
  store.deals[idx] = { ...row, ...payload, updated_at: now() };
  return delay(store.deals[idx]!);
}

export async function mockCloseDeal(
  tenantId: string,
  dealId: string,
  body: CloseDealBody,
): Promise<Deal> {
  const row = await mockUpdateDeal(tenantId, dealId, {
    status: "closed",
    fecha_cierre: now().slice(0, 10),
    notas: body.justification,
  });
  pushEvent(getStore(tenantId, row.project_id), row.project_id, tenantId, {
    event_type: "DEAL_CLOSED",
    entity_type: "deal",
    entity_id: row.id,
    amount_usd: row.monto_usd,
    currency: row.currency,
    actor_id: body.actor_id ?? "dashboard-user",
    description: body.justification,
    occurred_at: now(),
  });
  return row;
}

export async function mockDeleteDeal(tenantId: string, dealId: string): Promise<void> {
  const row = await mockGetDeal(tenantId, dealId);
  if (!row) return;
  const store = getStore(tenantId, row.project_id);
  store.deals = store.deals.filter((d) => d.id !== dealId);
  await delay(undefined);
}

// --- Eventos ---

export async function mockListEventosEconomicos(
  tenantId: string,
  projectId: string,
  filters?: FinanzasListFilters,
): Promise<PaginatedResponse<EconomicEvent>> {
  return delay(paginate(getStore(tenantId, projectId).eventos, filters));
}

export async function mockGetEventoEconomico(
  tenantId: string,
  eventoId: string,
): Promise<EconomicEvent | null> {
  for (const store of stores.values()) {
    const found = store.eventos.find((e) => e.id === eventoId);
    if (found) return delay(found);
  }
  return delay(null);
}

export { MOCK_TENANT_ID };

/**
 * Typed mock data + in-memory store for Proyectos Finanzas (Fase 2 Workstream C).
 * Swap hook implementations to real fetch when backend merges — UI unchanged.
 */

import type {
  BudgetSnapshot,
  BudgetVarianceReport,
  Cotizacion,
  Deal,
  EconomicEvent,
  Factura,
  FinanceOverview,
  OrdenCompra,
  Pago,
} from "@/types/finanzas";

import type { LineItem } from "@/types/finanzas";

export const MOCK_TENANT_ID = "d3b00111-0000-0000-0000-000000d3b001";

export function mockProjectId(projectId: string): string {
  return projectId || "569d40d2-4dd5-48b1-9ecd-e27f8f0649db";
}

const now = () => new Date().toISOString();
const uuid = () => crypto.randomUUID();

const line = (desc: string, qty: number, price: number, cat?: string) => ({
  id: uuid(),
  description: desc,
  quantity: qty,
  unit_price_usd: price,
  amount_usd: qty * price,
  category: cat,
});

export const mockBudget: BudgetSnapshot = {
  project_id: mockProjectId(""),
  tenant_id: MOCK_TENANT_ID,
  envelope_usd: 2_500_000,
  capex_usd: 1_800_000,
  opex_usd: 550_000,
  contingencia_usd: 150_000,
  currency: "USD",
  updated_at: now(),
};

export const mockCotizaciones: Cotizacion[] = [
  {
    id: "cot-001",
    tenant_id: MOCK_TENANT_ID,
    project_id: mockProjectId(""),
    contratista_id: "cont-001",
    contratista_nombre: "Constructora del Caribe SRL",
    numero_cotizacion: "COT-2026-001",
    categoria: "Estructura",
    monto_total_usd: 185_000,
    currency: "USD",
    status: "approved",
    fecha_emision: "2026-03-01",
    fecha_validez: "2026-04-01",
    line_items: [line("Hormigón estructural", 120, 850, "CAPEX"), line("Acero de refuerzo", 45, 1200, "CAPEX")],
    created_at: "2026-03-01T10:00:00Z",
    updated_at: "2026-03-05T14:00:00Z",
  },
  {
    id: "cot-002",
    tenant_id: MOCK_TENANT_ID,
    project_id: mockProjectId(""),
    contratista_id: "cont-002",
    contratista_nombre: "Instalaciones Técnicas RD",
    numero_cotizacion: "COT-2026-002",
    categoria: "MEP",
    monto_total_usd: 72_500,
    currency: "USD",
    status: "received",
    fecha_emision: "2026-04-10",
    line_items: [line("Cableado eléctrico", 1, 45000, "OPEX"), line("Plomería", 1, 27500, "OPEX")],
    created_at: "2026-04-10T09:00:00Z",
    updated_at: "2026-04-10T09:00:00Z",
  },
];

export const mockOrdenesCompra: OrdenCompra[] = [
  {
    id: "oc-001",
    tenant_id: MOCK_TENANT_ID,
    project_id: mockProjectId(""),
    cotizacion_id: "cot-001",
    contratista_id: "cont-001",
    contratista_nombre: "Constructora del Caribe SRL",
    numero_oc: "OC-2026-001",
    monto_total_usd: 185_000,
    currency: "USD",
    status: "issued",
    fecha_emision: "2026-03-08",
    fecha_entrega_esperada: "2026-06-30",
    line_items: mockCotizaciones[0]!.line_items,
    created_at: "2026-03-08T11:00:00Z",
    updated_at: "2026-03-08T11:30:00Z",
  },
  {
    id: "oc-002",
    tenant_id: MOCK_TENANT_ID,
    project_id: mockProjectId(""),
    contratista_id: "cont-003",
    contratista_nombre: "Paisajismo Tropical",
    numero_oc: "OC-2026-002",
    monto_total_usd: 28_000,
    currency: "USD",
    status: "draft",
    fecha_emision: "2026-04-15",
    line_items: [line("Diseño paisajístico", 1, 12000, "OPEX"), line("Implementación", 1, 16000, "OPEX")],
    created_at: "2026-04-15T08:00:00Z",
    updated_at: "2026-04-15T08:00:00Z",
  },
];

export const mockFacturas: Factura[] = [
  {
    id: "fac-001",
    tenant_id: MOCK_TENANT_ID,
    project_id: mockProjectId(""),
    orden_compra_id: "oc-001",
    contratista_id: "cont-001",
    contratista_nombre: "Constructora del Caribe SRL",
    numero_factura: "FAC-2026-001",
    monto_total_usd: 92_500,
    monto_pagado_usd: 92_500,
    saldo_pendiente_usd: 0,
    currency: "USD",
    validation_status: "approved",
    payment_status: "paid",
    validation_reason_codes: [],
    fecha_emision: "2026-04-01",
    fecha_vencimiento: "2026-05-01",
    line_items: [line("Avance estructura 50%", 1, 92500, "CAPEX")],
    created_at: "2026-04-01T12:00:00Z",
    updated_at: "2026-04-20T10:00:00Z",
  },
  {
    id: "fac-002",
    tenant_id: MOCK_TENANT_ID,
    project_id: mockProjectId(""),
    orden_compra_id: "oc-001",
    contratista_id: "cont-001",
    contratista_nombre: "Constructora del Caribe SRL",
    numero_factura: "FAC-2026-002",
    monto_total_usd: 48_000,
    monto_pagado_usd: 0,
    saldo_pendiente_usd: 48_000,
    currency: "USD",
    validation_status: "needs_pm_review",
    payment_status: "unpaid",
    validation_reason_codes: ["MONTO_DECLARADO_NO_COINCIDE", "FECHA_FUERA_DE_RANGO"],
    fecha_emision: "2026-04-28",
    line_items: [line("Avance estructura adicional", 1, 48000, "CAPEX")],
    created_at: "2026-04-28T15:00:00Z",
    updated_at: "2026-04-28T15:05:00Z",
  },
];

export const mockPagos: Pago[] = [
  {
    id: "pag-001",
    tenant_id: MOCK_TENANT_ID,
    project_id: mockProjectId(""),
    factura_id: "fac-001",
    numero_pago: "PAG-2026-001",
    monto_usd: 92_500,
    currency: "USD",
    status: "paid",
    metodo_pago: "transferencia",
    referencia: "TRX-88421",
    fecha_pago: "2026-04-18",
    actor_id: "dashboard-user",
    created_at: "2026-04-18T09:00:00Z",
    updated_at: "2026-04-18T09:30:00Z",
  },
  {
    id: "pag-002",
    tenant_id: MOCK_TENANT_ID,
    project_id: mockProjectId(""),
    factura_id: "fac-002",
    numero_pago: "PAG-2026-002",
    monto_usd: 48_000,
    currency: "USD",
    status: "pending",
    metodo_pago: "transferencia",
    fecha_programada: "2026-05-10",
    created_at: "2026-05-01T11:00:00Z",
    updated_at: "2026-05-01T11:00:00Z",
  },
];

export const mockDeals: Deal[] = [
  {
    id: "deal-001",
    tenant_id: MOCK_TENANT_ID,
    project_id: mockProjectId(""),
    titulo: "Joint venture financiamiento fase II",
    contraparte: "Inversiones Altamar SA",
    monto_usd: 750_000,
    currency: "USD",
    status: "open",
    fecha_inicio: "2026-01-15",
    fecha_cierre_esperada: "2026-12-31",
    created_at: "2026-01-15T08:00:00Z",
    updated_at: "2026-01-15T08:00:00Z",
  },
];

export const mockEventos: EconomicEvent[] = [
  {
    id: "evt-001",
    tenant_id: MOCK_TENANT_ID,
    project_id: mockProjectId(""),
    event_type: "QUOTE_APPROVED",
    entity_type: "cotizacion",
    entity_id: "cot-001",
    amount_usd: 185_000,
    currency: "USD",
    actor_id: "pm-user",
    description: "Cotización COT-2026-001 aprobada",
    occurred_at: "2026-03-05T14:00:00Z",
    created_at: "2026-03-05T14:00:00Z",
  },
  {
    id: "evt-002",
    tenant_id: MOCK_TENANT_ID,
    project_id: mockProjectId(""),
    event_type: "PO_ISSUED",
    entity_type: "orden_compra",
    entity_id: "oc-001",
    amount_usd: 185_000,
    currency: "USD",
    actor_id: "procurement-user",
    description: "OC-2026-001 emitida",
    occurred_at: "2026-03-08T11:30:00Z",
    created_at: "2026-03-08T11:30:00Z",
  },
  {
    id: "evt-003",
    tenant_id: MOCK_TENANT_ID,
    project_id: mockProjectId(""),
    event_type: "INVOICE_VALIDATED",
    entity_type: "factura",
    entity_id: "fac-002",
    amount_usd: 48_000,
    currency: "USD",
    description: "Factura FAC-2026-002 requiere revisión PM",
    metadata: { reason_codes: ["MONTO_DECLARADO_NO_COINCIDE"] },
    occurred_at: "2026-04-28T15:05:00Z",
    created_at: "2026-04-28T15:05:00Z",
  },
  {
    id: "evt-004",
    tenant_id: MOCK_TENANT_ID,
    project_id: mockProjectId(""),
    event_type: "PAYMENT_REGISTERED",
    entity_type: "pago",
    entity_id: "pag-001",
    amount_usd: 92_500,
    currency: "USD",
    actor_id: "finance-user",
    description: "Pago PAG-2026-001 confirmado",
    occurred_at: "2026-04-18T09:30:00Z",
    created_at: "2026-04-18T09:30:00Z",
  },
];

export const mockBudgetVariance: BudgetVarianceReport = {
  project_id: mockProjectId(""),
  rows: [
    { category: "CAPEX", planned_usd: 1_800_000, committed_usd: 185_000, invoiced_usd: 140_500, paid_usd: 92_500, variance_pct: 7.2 },
    { category: "OPEX", planned_usd: 550_000, committed_usd: 28_000, invoiced_usd: 0, paid_usd: 0, variance_pct: 5.1 },
    { category: "Contingencia", planned_usd: 150_000, committed_usd: 0, invoiced_usd: 0, paid_usd: 0, variance_pct: 0 },
  ],
  totals: {
    category: "Total",
    planned_usd: 2_500_000,
    committed_usd: 213_000,
    invoiced_usd: 140_500,
    paid_usd: 92_500,
    variance_pct: 6.8,
  },
};

export function buildMockFinanceOverview(projectId: string): FinanceOverview {
  const pid = mockProjectId(projectId);
  const facturado = mockFacturas.filter((f) => f.project_id === pid && f.validation_status === "approved")
    .reduce((s, f) => s + f.monto_total_usd, 0);
  const pagado = mockPagos.filter((p) => p.project_id === pid && p.status === "paid")
    .reduce((s, p) => s + p.monto_usd, 0);
  const comprometido = mockOrdenesCompra.filter((o) => o.project_id === pid && ["issued", "accepted"].includes(o.status))
    .reduce((s, o) => s + o.monto_total_usd, 0);
  const planned = mockBudget.envelope_usd;
  const variance = planned > 0 ? ((comprometido - planned) / planned) * 100 : 0;

  return {
    kpis: {
      presupuesto_total_usd: mockBudget.envelope_usd,
      capex_aprobado_usd: mockBudget.capex_usd,
      opex_aprobado_usd: mockBudget.opex_usd,
      comprometido_usd: comprometido,
      facturado_usd: facturado,
      pagado_usd: pagado,
      saldo_pendiente_usd: facturado - pagado,
      variance_pct: Math.round(variance * 10) / 10,
    },
    recent_events: mockEventos.filter((e) => e.project_id === pid).slice(0, 10),
    alerts: [
      {
        id: "alert-1",
        severity: "warning",
        title: "Factura pendiente de revisión > 30 días",
        description: "FAC-2026-002 en needs_pm_review desde 2026-04-28.",
      },
      {
        id: "alert-2",
        severity: "info",
        title: "CAPEX dentro de rango",
        description: "Variación CAPEX 7.2% — dentro del umbral ámbar (15%).",
      },
    ],
  };
}

export function cloneFinanzasSeed(projectId: string) {
  const pid = mockProjectId(projectId);
  const mapPid = <T extends { project_id: string; line_items?: LineItem[] }>(rows: T[]) =>
    rows.map((r) => ({
      ...r,
      project_id: pid,
      line_items: r.line_items?.map((li) => ({ ...li, id: uuid() })) ?? [],
    }));
  const mapSimple = <T extends { project_id: string }>(rows: T[]) =>
    rows.map((r) => ({ ...r, project_id: pid }));

  return {
    budget: { ...mockBudget, project_id: pid },
    cotizaciones: mapPid(mockCotizaciones),
    ordenes: mapPid(mockOrdenesCompra),
    facturas: mapPid(mockFacturas),
    pagos: mapSimple(mockPagos),
    deals: mapSimple(mockDeals),
    eventos: mapSimple(mockEventos),
    variance: { ...mockBudgetVariance, project_id: pid },
  };
}

/**
 * Mock fixtures — HANDOFF §3–§8 sample data (USE_API=false).
 * All canonical amounts live here; screens consume via adapter.
 */
import type {
  BankMetrics,
  BillingConfig,
  DashboardKPIs,
  DealerMetrics,
  Drilldown,
  DrilldownMap,
  Invoice,
  Reconciliation,
  Tenant,
} from "./types";

export const DEMO_TENANTS_DATA: Tenant[] = [
  {
    id: "banco-cibao",
    name: "Banco del Cibao",
    kind: "banco",
    model: "Híbrido (B2)",
    color: "#2bd073",
    initial: "BC",
  },
  {
    id: "banco-atlantico",
    name: "Banco Atlántico",
    kind: "banco",
    model: "Comisión pura",
    color: "#54a8ec",
    initial: "BA",
  },
  {
    id: "auto-credito-cibao",
    name: "Auto Crédito del Cibao",
    kind: "dealer",
    model: "Pro",
    color: "#a98bf0",
    initial: "AC",
  },
];

const mkEvent = (
  type: string,
  id: string,
  detail: string,
  amount: number,
  time: string,
  hash: string,
): Drilldown["events"][number] => ({
  type,
  id,
  detail,
  amount,
  time,
  hash,
  record_url: `/audit/events/${id}`,
});

function dd(
  title: string,
  sub: string,
  aggLabel: string,
  events: Drilldown["events"],
  count: string,
  foot: string,
): Drilldown {
  const aggValue = events.reduce((s, e) => s + e.amount, 0);
  return {
    title,
    sub,
    agg_label: aggLabel,
    agg: aggValue,
    aggValue,
    count,
    foot,
    events,
  };
}

export const DRILLDOWNS: DrilldownMap = {
  gmv: dd(
    "GMV · préstamos fundeados",
    "Volumen financiado agregado · mayo 2026",
    "Volumen financiado",
    [
      mkEvent("PRÉSTAMO", "DEAL-7801", "Banco del Cibao · ganó subasta", 5_200_000, "05 may 16:40", "0x1c2f…a9"),
      mkEvent("PRÉSTAMO", "DEAL-7829", "Banco Nacional RD · ganó subasta", 4_300_000, "11 may 15:33", "0xa15b…02"),
      mkEvent("PRÉSTAMO", "DEAL-7782", "Banco del Cibao · ganó subasta", 3_450_000, "02 may 14:22", "0x9f3a…c1"),
      mkEvent("PRÉSTAMO", "DEAL-7790", "Banco Atlántico · ganó subasta", 2_100_000, "03 may 09:11", "0x4b8e…7d"),
      mkEvent("PRÉSTAMO", "DEAL-7815", "Banco del Cibao · ganó subasta", 1_850_000, "08 may 11:05", "0x77d0…3e"),
    ],
    "34 préstamos desembolsados",
    "Mostrando 5 de 34 · ordenados por monto",
  ),
  comision: dd(
    "Comisión sobre préstamos fundeados",
    "Banco del Cibao · 30 bps · mayo 2026",
    "Total comisión",
    [
      mkEvent("PRÉSTAMO", "DEAL-7801", "principal RD$ 5,200,000 · 30 bps", 15_600, "05 may 16:40", "0x1c2f…a9"),
      mkEvent("PRÉSTAMO", "DEAL-7782", "principal RD$ 3,450,000 · 30 bps", 10_350, "02 may 14:22", "0x9f3a…c1"),
      mkEvent("PRÉSTAMO", "DEAL-7790", "principal RD$ 2,100,000 · 30 bps", 6_300, "03 may 09:11", "0x4b8e…7d"),
      mkEvent("PRÉSTAMO", "DEAL-7815", "principal RD$ 1,850,000 · 30 bps", 5_550, "08 may 11:05", "0x77d0…3e"),
      mkEvent("PRÉSTAMO", "DEAL-7829", "principal RD$ 4,300,000 · 30 bps", 12_900, "11 may 15:33", "0xa15b…02"),
      mkEvent("PRÉSTAMO", "DEAL-7799", "principal RD$ 6,500,000 · 30 bps", 19_500, "16 may 16:30", "0x9aa1…01"),
      mkEvent("PRÉSTAMO", "DEAL-7805", "principal RD$ 5,480,000 · 30 bps", 165_300, "28 may 10:12", "0xbeef…99"),
    ],
    "34 préstamos · 30 bps c/u",
    "Mostrando 7 de 34 · RD$ 235,500.00",
  ),
  ai: dd(
    "AI metered · consumo de IA",
    "Banco del Cibao · passthrough + margen",
    "Total AI metered",
    [
      mkEvent("DECISIÓN IA", "SCORING", "12,480 decisiones · RD$ 2.50 c/u", 31_200, "mayo 2026", "0x3e91…4c"),
      mkEvent("DOCUMENTO", "SIC-OCR", "3,210 documentos · RD$ 6.00 c/u", 19_260, "mayo 2026", "0x88a2…f0"),
      mkEvent("TOKENS", "TOKENS", "1.49M tokens · passthrough + margen", 8_940, "mayo 2026", "0x0d77…b3"),
    ],
    "3 tipos de evento",
    "Agregado por tipo · 15,690 eventos individuales trazables",
  ),
  base: dd(
    "Suscripción Híbrido · base mensual",
    "contrato CT-2026-0142",
    "Base mensual",
    [mkEvent("CONTRATO", "CT-2026-0142", "Plan Híbrido · base mensual mayo", 85_000, "01 may 00:00", "0xc4f1…9e")],
    "1 cargo recurrente",
    "Vigente desde 01 abr 2026 · versión v3",
  ),
  seats: dd(
    "Seats · analistas activos",
    "RD$ 1,500/seat",
    "Total seats",
    [
      mkEvent("SEAT", "usr_ana.disla", "última sesión 31 may 18:02", 1_500, "31 may 18:02", "0xab10…22"),
      mkEvent("SEAT", "usr_l.fermin", "30 may 09:40", 1_500, "30 may 09:40", "0xab10…23"),
      mkEvent("SEAT", "usr_j.peralta", "29 may 14:18", 1_500, "29 may 14:18", "0xab10…24"),
      mkEvent("SEAT", "usr_m.santos", "28 may 11:55", 1_500, "28 may 11:55", "0xab10…25"),
      mkEvent("SEAT", "usr_a.lopez", "27 may 16:10", 1_500, "27 may 16:10", "0xab10…26"),
      mkEvent("SEAT", "usr_c.ramos", "26 may 08:44", 1_500, "26 may 08:44", "0xab10…27"),
      mkEvent("SEAT", "usr_d.mejia", "25 may 13:22", 1_500, "25 may 13:22", "0xab10…28"),
      mkEvent("SEAT", "usr_e.gomez", "24 may 19:01", 1_500, "24 may 19:01", "0xab10…29"),
    ],
    "8 analistas activos",
    "Seat = analista con ≥1 sesión en el periodo",
  ),
  takerate: dd(
    "Take rate · ingreso / GMV",
    "ingreso RD$ 1,569,200 sobre GMV facturable",
    "Take rate efectivo",
    [
      mkEvent("PRÉSTAMO", "Comisión", "success fee sobre fundeados", 642_500, "mayo 2026", "0xt1…01"),
      mkEvent("CONTRATO", "Suscripción", "bases mensuales + ilimitado", 470_000, "mayo 2026", "0xt1…02"),
      mkEvent("DECISIÓN IA", "AI metered", "decisiones + documentos + tokens", 286_400, "mayo 2026", "0xt1…03"),
      mkEvent("SEAT", "Seats", "analistas activos", 92_000, "mayo 2026", "0xt1…04"),
      mkEvent("PRÉSTAMO", "Overage", "otros ingresos", 78_300, "mayo 2026", "0xt1…05"),
    ],
    "ingreso / GMV facturable",
    "GMV facturable = volumen de tenants con comisión activa",
  ),
  mrr: dd(
    "MRR · ingreso recurrente",
    "Excluye success fee y AI variable",
    "MRR",
    [
      mkEvent("CONTRATO", "Banco del Cibao", "Híbrido · base + seats", 97_000, "mayo 2026", "0xm1…01"),
      mkEvent("CONTRATO", "Banco Nacional RD", "Ilimitado · flat", 380_000, "mayo 2026", "0xm1…02"),
      mkEvent("CONTRATO", "Auto Crédito del Cibao", "Dealer Pro · mensual", 18_000, "mayo 2026", "0xm1…03"),
      mkEvent("CONTRATO", "Motores Caribe", "Dealer Start", 4_900, "mayo 2026", "0xm1…04"),
      mkEvent("CONTRATO", "Otros tenants", "bases recurrentes", 1_340_100, "mayo 2026", "0xm1…05"),
    ],
    "recurrente",
    "Excluye success fee y AI variable",
  ),
  margen: dd(
    "Margen bruto · ingreso − costo de servir",
    "Costo de servir = LLM por core + infra prorrateada",
    "Margen bruto",
    [
      mkEvent("DECISIÓN IA", "Credit / Forge", "ingreso 980K · costo 392K · 60%", 588_000, "mayo 2026", "0xg1…01"),
      mkEvent("DOCUMENTO", "SIC", "ingreso 286K · costo 120K · 58%", 166_000, "mayo 2026", "0xg1…02"),
      mkEvent("CONTRATO", "Legal", "ingreso 168K · costo 41K · 76%", 127_000, "mayo 2026", "0xg1…03"),
    ],
    "ingreso − costo servir",
    "Costo de servir = LLM por core + infra prorrateada",
  ),
};

export const INVOICE_MAY_2026: Invoice = {
  number: "FACT-2026-05-0142",
  tenant_id: "banco-cibao",
  period: "mayo 2026",
  model: "Híbrido (B2)",
  issued_at: "01 jun 2026",
  rnc: "1-31-00000-1",
  lines: [
    {
      label: "Comisión sobre préstamos fundeados",
      count: 34,
      note: "30 bps · principal RD$ 78,500,000.00",
      amount: 235_500,
      drilldown_key: "comision",
    },
    {
      label: "Suscripción Híbrido · base mensual",
      count: 1,
      note: "plan híbrido · mayo 2026",
      amount: 85_000,
      drilldown_key: "base",
    },
    {
      label: "AI metered",
      count: 15_690,
      note: "12,480 decisiones · 3,210 documentos · 1.49M tokens",
      amount: 59_400,
      drilldown_key: "ai",
    },
    {
      label: "Seats",
      count: 8,
      note: "8 analistas activos · RD$ 1,500 c/u",
      amount: 12_000,
      drilldown_key: "seats",
    },
  ],
  min_guarantee: 150_000,
  setup_note: "Setup inicial (B5) RD$ 25,000.00 — facturado una vez en abr 2026, no se repite.",
  subtotal: 391_900,
  itbis: 70_542,
  total: 462_442,
};

export const RECONCILIATION_MAY_2026: Reconciliation = {
  lines_count: 4,
  events_count: 15_732,
  reconciled_sum: 391_900,
  discrepancy: 0,
  matches: [
    {
      label: "Comisión sobre préstamos fundeados",
      events: 34,
      billed: 235_500,
      sum: 235_500,
      drilldown_key: "comision",
      ok: true,
    },
    {
      label: "Suscripción Híbrido · base mensual",
      events: 1,
      billed: 85_000,
      sum: 85_000,
      drilldown_key: "base",
      ok: true,
    },
    { label: "AI metered", events: 15_690, billed: 59_400, sum: 59_400, drilldown_key: "ai", ok: true },
    { label: "Seats", events: 8, billed: 12_000, sum: 12_000, drilldown_key: "seats", ok: true },
  ],
  ledger: [
    mkEvent("PRÉSTAMO", "DEAL-7801", "fundeado 05 may 16:40", 15_600, "05 may 16:40", "0x1c2f…a9"),
    mkEvent("DECISIÓN IA", "SCO-44128", "scoring SOL-9920", 2.5, "16:38", "0x3e91…4c"),
    mkEvent("DOCUMENTO", "DOC-22107", "OCR cédula SOL-9917", 6, "16:33", "0x88a2…f0"),
    mkEvent("PRÉSTAMO", "DEAL-7790", "fundeado 03 may 09:11", 6_300, "03 may 09:11", "0x4b8e…7d"),
    mkEvent("CONTRATO", "CT-2026-0142", "base mensual mayo", 85_000, "01 may 00:00", "0xc4f1…9e"),
    mkEvent("SEAT", "usr_ana.disla", "seat activo 31 may", 1_500, "31 may 18:02", "0xab10…22"),
  ],
};

export const BILLING_CONFIG_DEFAULT: BillingConfig = {
  base_model: "B2",
  bps: 30,
  add_setup: false,
  add_ai: true,
  // add_seats feeds whatif() seat line (§201). Config UI toggles = Setup B5 + AI only (§168–170).
  // Seats tariff (§179, RD$1,500/analista) is a base-plan line from active analysts — not a toggleable add-on.
  add_seats: true,
  cores: { Marketing: false, "Credit / Forge": true, Legal: true, SIC: true, Projects: false },
  versions: [
    { tariff: "30 bps", range: "vigente desde 01 may 2026", current: true },
    { tariff: "35 bps", range: "01 ene – 30 abr 2026" },
    { tariff: "40 bps", range: "onboarding 12 sep – 31 dic 2025" },
  ],
  contract: { id: "CT-2026-0142", owner: "M. Disla", signed_at: "28 mar 2026" },
};

export const DASHBOARD_KPIS: DashboardKPIs = {
  gmv: "RD$ 78.5M",
  take_rate: "2.8%",
  mrr: "RD$ 1.84M",
  margen_bruto: "61%",
  subastas_activas: 27,
  bancos_en_linea: "18/20",
  aprobacion: "47%",
  tiempo_primera_oferta: "4.2s",
  revenue_by_model: [
    { label: "Comisión (success fee)", amount: 642_500, pct: 41, color: "green" },
    { label: "Suscripción / base", amount: 470_000, pct: 30, color: "blue" },
    { label: "AI metered", amount: 286_400, pct: 18, color: "violet" },
    { label: "Seats", amount: 92_000, pct: 6, color: "amber" },
    { label: "Overage / otros", amount: 78_300, pct: 5, color: "sub" },
  ],
  tape: [
    { time: "16:40", type: "FUNDEADO", text: "DEAL-7801 · Banco del Cibao", amount: "+15,600" },
    { time: "16:38", type: "IA", text: "scoring · solicitud SOL-9920", amount: "+2.50" },
    { time: "16:35", type: "OFERTA", text: "Banco Atlántico → SOL-9918" },
    { time: "16:33", type: "DOC", text: "OCR cédula · SOL-9917", amount: "+6.00" },
    { time: "16:30", type: "FUNDEADO", text: "DEAL-7799 · Banco Nacional RD", amount: "+9,300" },
    { time: "16:28", type: "IA", text: "análisis SIC · SOL-9915", amount: "+6.00" },
  ],
  tenants: [
    {
      name: "Banco del Cibao",
      kind: "banco",
      model: "Híbrido",
      gmv: 78_500_000,
      revenue: 391_900,
      cost: 152_800,
      margin_pct: 61,
      status: "ok",
      initial: "BC",
      color: "#2bd073",
    },
    {
      name: "Banco Atlántico",
      kind: "banco",
      model: "Comisión pura",
      gmv: 54_200_000,
      revenue: 271_000,
      cost: 246_600,
      margin_pct: 9,
      status: "bad",
      initial: "BA",
      color: "#54a8ec",
    },
    {
      name: "Banco Nacional RD",
      kind: "banco",
      model: "Ilimitado",
      gmv: 102_100_000,
      revenue: 380_000,
      cost: 198_400,
      margin_pct: 48,
      status: "ok",
      initial: "BN",
      color: "#f4b740",
    },
    {
      name: "Auto Crédito del Cibao",
      kind: "dealer",
      model: "Pro",
      gmv: 23_400_000,
      revenue: 48_500,
      cost: 31_200,
      margin_pct: 36,
      status: "warn",
      initial: "AC",
      color: "#a98bf0",
    },
    {
      name: "Motores Caribe",
      kind: "dealer",
      model: "Start",
      gmv: 6_100_000,
      revenue: 14_200,
      cost: 9_800,
      margin_pct: 31,
      status: "ok",
      initial: "MC",
      color: "#54a8ec",
    },
  ],
  alerts: [
    {
      kind: "MARGEN BAJO UMBRAL",
      text: "Banco Atlántico · margen efectivo 9% < 15%",
      severity: "bad",
    },
    {
      kind: "CERCA DEL LÍMITE",
      text: "Auto Crédito del Cibao · 92% de solicitudes del plan",
      severity: "warn",
    },
    {
      kind: "COSTO LLM DISPARADO",
      text: "Banco Nacional RD · +38% vs. mes previo",
      severity: "warn",
    },
  ],
};

/** P5 · Banco del Cibao — HANDOFF §347–359 */
export const BANK_METRICS_MAY_2026: BankMetrics = {
  tenant_id: "banco-cibao",
  period: "mayo 2026",
  model_label: "Híbrido (B2)",
  funnel: [
    { label: "Solicitudes recibidas", value: 1_842, conv: "100%" },
    { label: "Ofertas emitidas", value: 1_401, conv: "76% emisión" },
    { label: "Ofertas ganadas", value: 212, conv: "15% win rate" },
    { label: "Préstamos fundeados", value: 34, conv: "16% cierre" },
  ],
  sla: { p50: "3.1s", p95: "8.7s", within_pct: 96.2, reject_pct: 12 },
  ai_usage: { decisions: 12_480, documents: 3_210, tokens: "1.49M", cost: 59_400 },
  invoice_current: 462_442,
  invoice_projected: 511_800,
};

/** P6 · Auto Crédito del Cibao — HANDOFF §363–372 */
export const DEALER_METRICS_MAY_2026: DealerMetrics = {
  tenant_id: "auto-credito-cibao",
  period: "mayo 2026",
  plan: "Pro",
  funnel: [
    { label: "Solicitudes originadas", value: 552, conv: "100%" },
    { label: "Enviadas a bancos", value: 538, conv: "97% ruteo" },
    { label: "Ofertas recibidas", value: 441, conv: "82% respuesta" },
    { label: "Deals desembolsados", value: 212, conv: "38% L2B" },
  ],
  look_to_book: { pct: 38, delta: "+5pp vs. abr" },
  bank_mix: [
    { name: "Banco del Cibao", initial: "BC", color: "#2bd073", deals: 92, pct: 43 },
    { name: "Banco Nacional RD", initial: "BN", color: "#f4b740", deals: 66, pct: 31 },
    { name: "Banco Atlántico", initial: "BA", color: "#54a8ec", deals: 38, pct: 18 },
    { name: "Otros (3)", initial: "+3", color: "#74908f", deals: 16, pct: 8 },
  ],
  kpis: { volume: 23_400_000, apr_pct: 16.2, time_to_offer: "3.8s", seats: 4 },
  dealer_fees: { limit_pct: 92, base: 18_000, requests_used: 552, requests_limit: 600, overage: 48 },
};

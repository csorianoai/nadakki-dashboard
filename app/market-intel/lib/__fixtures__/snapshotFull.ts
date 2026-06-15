import type { PricingProposal, RunResponse, SnapshotPayload } from "../types";

const baseSnapshot: Omit<SnapshotPayload, "market_overview" | "pricing_proposal" | "entry_strategy"> = {
  sources_summary: {
    total: 6,
    by_level: { "1": 4, "2": 1, "3": 1 },
    by_confidence: { alto: 3, medio: 2, bajo: 1 },
  },
  findings: [
    {
      id: "f1",
      source_name: "BCRD · Informe de Estabilidad Financiera 2024",
      source_level: "1",
      confidence: "alto",
      category: "market",
      tier: "auto_research",
      validation_status: "pending",
      requires_counsel_review: false,
      summary: "La cartera de crédito total del sistema cerró 2024 en RD$2.18 billones.",
      data_points: [
        { metric: "outstanding_auto_portfolio", value: 54599000000, unit: "DOP", year: 2024 },
        { metric: "consumer_credit_growth", value: 14.6, unit: "pct", year: 2024 },
      ],
    },
    {
      id: "f2",
      source_name: "SB · Informe Cartera Vehicular 2024",
      source_level: "1",
      confidence: "medio",
      category: "regulatory",
      tier: "auto_research",
      validation_status: "pending",
      requires_counsel_review: true,
      summary: "Los cuatro mayores tenedores concentran el 65.1% del mercado.",
      data_points: [{ metric: "top4_concentration", value: 65.1, unit: "pct", year: 2024 }],
    },
  ],
  validation_state: "pending_human_review",
  metadata: {
    version: "1.1",
    fixture: "snapshotFull",
    pipeline: [
      { agent: "data_scout", label: "Data Scout", status: "done", duration_s: 84, sources: 6 },
      { agent: "market_analyst", label: "Market Analyst", status: "done", duration_s: 142, findings: 6 },
      { agent: "strategist", label: "Strategist", status: "done", duration_s: 96 },
      { agent: "pricing_analyst", label: "Pricing Analyst", status: "done", duration_s: 71 },
    ],
  },
};

export const snapshotFullPricingProposal: PricingProposal = {
  tier: "estimate",
  currency: "USD",
  fx_to_usd: 62,
  validation_status: "pending",
  requires_counsel_review: false,
  plans: [
    {
      name: "Starter",
      setup_fee: 500,
      per_application_fee: 15,
      monthly_min: 0,
      target: "Cooperativas y financieras",
      features: ["Scoring digital estándar", "Hasta 500 solicitudes/mes"],
    },
    {
      name: "Pro",
      setup_fee: 1500,
      per_application_fee: 10,
      monthly_min: 1000,
      target: "Bancos Tier2 · recomendado",
      features: ["Scoring + reglas configurables", "API y webhooks"],
    },
    {
      name: "Enterprise",
      setup_fee: 5000,
      per_application_fee: 7,
      monthly_min: 5000,
      target: "Bancos Tier1",
      features: ["Todo lo de Pro", "SLA 99.9%"],
    },
  ],
  dealer_tiers: [
    { tier: "small", label: "Pequeño", discount_pct: 0, min_apps_month: 0 },
    { tier: "medium", label: "Mediano", discount_pct: 10, min_apps_month: 20 },
    { tier: "large", label: "Grande", discount_pct: 20, min_apps_month: 100 },
  ],
};

export const snapshotFullEntryStrategy = {
  target_segment: "vehiculos_usados",
  angle: "Aprobación digital en 24h para vehículos usados.",
  sales_arguments: [
    "La aprobación formal del 62% deja un 38% de mercado sin servir.",
    "Ticket promedio de RD$1.8M con tenor de 60 meses.",
    "Las financieras no bancarias carecen de scoring digital.",
  ],
  institution_tiers: [
    {
      tier: "Tier1",
      rationale: "Mayor cartera auto existente.",
      names: [
        { name: "Banco Popular Dominicano", portfolio_rd: 11008000000, participation_pct: 20.2 },
        { name: "Banreservas", portfolio_rd: 8737000000, participation_pct: 16.0 },
      ],
    },
    {
      tier: "Tier2",
      rationale: "Alto fit con scoring de usados.",
      names: [
        { name: "BHD León", portfolio_rd: 8168000000, participation_pct: 15.0 },
        { name: "Motor Crédito", portfolio_rd: 7596000000, participation_pct: 13.9 },
      ],
    },
    {
      tier: "Tier3",
      rationale: "Entrada white-label rápida.",
      names: [
        { name: "Banco Caribe", portfolio_rd: 2908000000, participation_pct: 5.3 },
        { name: "Confisa", portfolio_rd: 1800000000, participation_pct: 3.3 },
      ],
    },
  ],
};

export const snapshotFull: SnapshotPayload = {
  ...baseSnapshot,
  market_overview: {
    market_size_local: 54_599_000_000,
    market_size_usd: 880_600_000,
    growth_rate_pct: 12.3,
    avg_interest_rate_pct: 17.8,
    npl_ratio_pct: 4.2,
    key_players: [
      "Banco Popular Dominicano (RD$11,008M — 20.2% cartera auto)",
      "Banreservas (RD$8,737M — 16.0%)",
    ],
    regulatory_environment:
      "Regulado por la Superintendencia de Bancos (SB) y el Banco Central (BCRD).",
    institution_shares: [
      { name: "Banco Popular Dominicano", tier: "Tier1", portfolio_rd: 11008000000, participation_pct: 20.2 },
      { name: "Banreservas", tier: "Tier1", portfolio_rd: 8737000000, participation_pct: 16.0 },
      { name: "BHD León", tier: "Tier2", portfolio_rd: 8168000000, participation_pct: 15.0 },
      { name: "Motor Crédito", tier: "Tier2", portfolio_rd: 7596000000, participation_pct: 13.9 },
    ],
  },
  entry_strategy: snapshotFullEntryStrategy,
  pricing_proposal: snapshotFullPricingProposal,
};

export const snapshotFullRun: RunResponse = {
  id: "mee_run_2026_06_DO_auto",
  status: "needs_validation",
  country_iso: "DO",
  vertical: "banca_credito",
  product: "Crédito automotriz",
  currency: "DOP",
  created_at: new Date(Date.now() - 14 * 60_000).toISOString(),
  updated_at: new Date(Date.now() - 14 * 60_000).toISOString(),
};

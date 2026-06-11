import type { RunResponse, SnapshotPayload } from "./types";

const now = new Date().toISOString();

export const FIXTURE_RUNS: RunResponse[] = [
  {
    id: "run-fixture-draft",
    status: "draft",
    country_iso: "DO",
    vertical: "consumer_credit",
    product: "personal_loan",
    currency: "DOP",
    created_at: now,
    updated_at: now,
  },
  {
    id: "run-fixture-needs-validation",
    status: "needs_validation",
    country_iso: "DO",
    vertical: "consumer_credit",
    product: "auto_loan",
    currency: "DOP",
    snapshot_sha256: "a3f2c1d9e8b7…fixture",
    created_at: new Date(Date.now() - 86_400_000).toISOString(),
    updated_at: now,
  },
  {
    id: "run-fixture-validated",
    status: "validated",
    country_iso: "DO",
    vertical: "sme_lending",
    product: "working_capital",
    currency: "DOP",
    validated_by: "counsel@credicefi.com",
    validated_at: new Date(Date.now() - 3_600_000).toISOString(),
    snapshot_sha256: "b4e3d2c1a0f9…fixture",
    created_at: new Date(Date.now() - 172_800_000).toISOString(),
    updated_at: now,
  },
];

export const FIXTURE_SNAPSHOTS: Record<string, SnapshotPayload> = {
  "run-fixture-needs-validation": {
    sources_summary: {
      total: 14,
      by_level: { regulatory: 3, market: 6, operator_upload: 1, secondary: 4 },
      by_confidence: { high: 7, medium: 5, low: 2 },
    },
    findings: [
      {
        source_name: "SB Resolución 2024-12",
        source_level: "regulatory",
        confidence: "high",
        category: "capital_requirements",
        tier: "T1",
        validation_status: "verified",
        requires_counsel_review: false,
        summary: "Requisitos de capital mínimo para originadores no bancarios al 12%.",
        data_points: [{ metric: "capital_min_pct", value: 12 }],
      },
      {
        source_name: "Informe sectorial Q1 2025",
        source_level: "market",
        confidence: "medium",
        category: "market_share",
        tier: "T2",
        validation_status: "pending",
        requires_counsel_review: true,
        summary: "La cuña de mercado entre bancos comerciales y cooperativas se estrecha 1.2 pp.",
        data_points: [{ metric: "wedge_delta_pp", value: -1.2 }],
      },
      {
        source_name: "Documento interno — política de precios",
        source_level: "operator_upload",
        confidence: "medium",
        category: "pricing",
        tier: "T3",
        validation_status: "pending",
        requires_counsel_review: false,
        summary: "Borrador de política de precios subido por operador; se reflejará al re-investigar.",
        data_points: [],
      },
    ],
    market_overview: {
      headline: "Crédito de consumo — República Dominicana",
      wedge_callout:
        "Oportunidad en préstamos personales digitales: los bancos tradicionales concentran el 68% de cartera pero ceden participación en originación digital.",
      total_market_rd: 285_000_000_000,
      institution_shares: [
        { name: "Banco Popular", tier: "T1", portfolio_rd: 98_000_000_000, participation_pct: 34.4 },
        { name: "BHD León", tier: "T1", portfolio_rd: 52_000_000_000, participation_pct: 18.2 },
        { name: "Banreservas", tier: "T1", portfolio_rd: 48_000_000_000, participation_pct: 16.8 },
        { name: "Asociación La Nacional", tier: "T2", portfolio_rd: 22_000_000_000, participation_pct: 7.7 },
        { name: "Cooperativas (agregado)", tier: "T3", portfolio_rd: 18_000_000_000, participation_pct: 6.3 },
        { name: "Fintech / NBFC", tier: "T3", portfolio_rd: 12_000_000_000, participation_pct: 4.2 },
      ],
      priority_tiers: [
        { tier: "T1", label: "Prioridad alta", count: 3, description: "Bancos con >15% participación" },
        { tier: "T2", label: "Prioridad media", count: 4, description: "Cooperativas y ACP regionales" },
        { tier: "T3", label: "Exploración", count: 7, description: "Fintech y nichos emergentes" },
      ],
    },
    entry_strategy: {
      positioning: "Originador digital enfocado en préstamos personales < RD$500K",
      channels: ["partnership_dealer", "direct_digital"],
      timeline_months: 9,
      regulatory_notes: "Licencia de originador no bancario requerida antes de originación.",
    },
    pricing_proposal: {
      base_rate_apr: 24.5,
      risk_premium_bps: 350,
      suggested_spread: "SB tasa referencia + 8.5%",
      fee_structure: { origination_pct: 2.0, late_fee_rd: 500 },
    },
    validation_state: "pending_human_review",
    metadata: { version: "1.1", generated_at: now, fixture: true },
  },
  "run-fixture-validated": {
    sources_summary: {
      total: 11,
      by_level: { regulatory: 4, market: 5, secondary: 2 },
      by_confidence: { high: 8, medium: 3, low: 0 },
    },
    findings: [
      {
        source_name: "SB Circular SME 2023",
        source_level: "regulatory",
        confidence: "high",
        category: "sme_lending",
        tier: "T1",
        validation_status: "verified",
        requires_counsel_review: false,
        summary: "Marco regulatorio para crédito PYME consolidado.",
        data_points: [],
      },
    ],
    market_overview: {
      headline: "Crédito PYME — República Dominicana",
      total_market_rd: 95_000_000_000,
      institution_shares: [
        { name: "Banreservas", tier: "T1", portfolio_rd: 28_000_000_000, participation_pct: 29.5 },
        { name: "Banco Popular", tier: "T1", portfolio_rd: 24_000_000_000, participation_pct: 25.3 },
      ],
    },
    validation_state: "pending_human_review",
    metadata: { version: "1.1", generated_at: now, fixture: true },
  },
};

export function fixtureRunById(id: string): RunResponse | undefined {
  return FIXTURE_RUNS.find((r) => r.id === id);
}

export function fixtureSnapshotByRunId(runId: string): SnapshotPayload | null {
  return FIXTURE_SNAPSHOTS[runId] ?? null;
}

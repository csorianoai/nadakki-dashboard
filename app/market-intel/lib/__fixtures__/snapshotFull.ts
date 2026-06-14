import type { PricingProposal, SnapshotPayload } from "../types";

const baseSnapshot: Omit<SnapshotPayload, "market_overview" | "pricing_proposal"> = {
  sources_summary: {
    total: 3,
    by_level: { regulatory: 1, market: 2 },
    by_confidence: { high: 2, medium: 1 },
  },
  findings: [],
  validation_state: "pending_human_review",
  metadata: { version: "1.1", fixture: "snapshotFull" },
};

export const snapshotFullPricingProposal: PricingProposal = {
  tier: "estimate",
  currency: "USD",
  fx_to_usd: 62,
  validation_status: "pending",
  requires_counsel_review: false,
  plans: [
    { name: "Starter", setup_fee: 500, per_application_fee: 15 },
    { name: "Pro", setup_fee: 1500, per_application_fee: 10 },
    { name: "Enterprise", setup_fee: 5000, per_application_fee: 7 },
  ],
  dealer_tiers: [
    { tier: "Bronze", monthly_fee: 200, features: ["Queue básica", "1 usuario"] },
    { tier: "Silver", monthly_fee: 450, features: ["Analytics", "5 usuarios"] },
    { tier: "Gold", monthly_fee: 900, features: ["API", "Usuarios ilimitados"] },
  ],
};

export const snapshotFull: SnapshotPayload = {
  ...baseSnapshot,
  market_overview: {
    market_size_local: 285_000_000_000,
    market_size_usd: 4_600_000_000,
    growth_rate_pct: 6.8,
    key_players: ["Banco Popular", "BHD León", "Banreservas"],
    regulatory_environment: "Supervisión SIB y BCRD; alineación Basilea II para originadores.",
    institution_shares: [
      { name: "Banco Popular", tier: "T1", portfolio_rd: 98_000_000_000, participation_pct: 34.4 },
      { name: "BHD León", tier: "T1", portfolio_rd: 52_000_000_000, participation_pct: 18.2 },
    ],
  },
  pricing_proposal: snapshotFullPricingProposal,
};

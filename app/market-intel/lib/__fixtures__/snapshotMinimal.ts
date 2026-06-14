import type { SnapshotPayload } from "../types";

export const snapshotMinimal: SnapshotPayload = {
  sources_summary: {
    total: 0,
    by_level: {},
    by_confidence: {},
  },
  findings: [],
  market_overview: {
    market_size_local: null,
    market_size_usd: null,
    growth_rate_pct: null,
    key_players: [],
    regulatory_environment: null,
    institution_shares: [],
  },
  pricing_proposal: {
    tier: "estimate",
    currency: "USD",
    plans: [],
    dealer_tiers: [],
  },
  validation_state: "pending_human_review",
  metadata: { version: "1.1", fixture: "snapshotMinimal" },
};

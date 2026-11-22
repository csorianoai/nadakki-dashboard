import type { ResumenInsights } from "../contrato";

export function resumen(over: Partial<ResumenInsights> = {}): ResumenInsights {
  return {
    period: { from: "2026-10-12", to: "2026-11-10", days: 30 },
    previous_period: { from: "2026-09-12", to: "2026-10-11", days: 30 },
    as_of: "2026-11-10T08:00:00Z",
    last_days_may_change: 3,
    currency: { code: "DOP", source: "google_ads_api", confirmed: true },
    accounts: [{ customer_id: "8221111139", label: "822***139", currency: "DOP" }],
    requires_account_selection: false,
    kpis: {
      spend: { value: 1000, previous: 800, delta_pct: 25, status: "ok" },
      conversions: { value: 20, previous: 10, delta_pct: 100, status: "ok" },
      cpa: { value: 50, previous: 80, delta_pct: -37.5, status: "ok" },
      ctr: { value: 0.05, previous: 0.04, delta_pct: 25, status: "ok" },
      clicks: { value: 400, previous: 300, delta_pct: 33, status: "ok" },
      impressions: { value: 8000, previous: 7500, delta_pct: 6, status: "ok" },
      avg_cpc: { value: 2.5, previous: 2.6, delta_pct: -4, status: "ok" },
      roas: { value: 3, previous: 2.5, delta_pct: 20, status: "ok" },
    },
    series: [{ date: "2026-11-09", spend: 30, clicks: 12, conversions: 1 }],
    previous_series: [{ date: "2026-10-09", spend: 25, clicks: 10, conversions: 0 }],
    campaigns: [{ campaign_id: "1", name: "Camp A", status: "ENABLED", spend: 600, clicks: 200, conversions: 12, cpa: 50 }, { campaign_id: "2", name: "Camp B", status: "ENABLED", spend: 400, clicks: 200, conversions: 2, cpa: 200 }],
    coverage: { days_in_period: 30, days_with_data: 30, tables_present: true },
    economics: { status: "pending" },
    ...over,
  };
}

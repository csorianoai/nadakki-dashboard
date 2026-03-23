export type AdvertisingDashboardData = {
  platforms: unknown[];
  spend_total: number;
  active_ads: number;
  impressions: number;
  source: string;
  [key: string]: unknown;
};

export const FALLBACK_ADVERTISING_DASHBOARD: AdvertisingDashboardData = {
  platforms: [],
  spend_total: 0,
  active_ads: 0,
  impressions: 0,
  source: "fallback",
};

/** Normalize API envelope `{ data: ... }` or flat dashboard payload. */
export function normalizeAdvertisingDashboard(raw: unknown): AdvertisingDashboardData {
  const fb = { ...FALLBACK_ADVERTISING_DASHBOARD };
  if (!raw || typeof raw !== "object") return fb;
  const r = raw as Record<string, unknown>;
  const inner =
    r.data !== undefined && typeof r.data === "object" && r.data !== null && !Array.isArray(r.data)
      ? (r.data as Record<string, unknown>)
      : r;
  const platforms = Array.isArray(inner.platforms) ? inner.platforms : [];
  return {
    ...fb,
    ...inner,
    platforms,
    spend_total: Number(inner.spend_total ?? fb.spend_total),
    active_ads: Number(inner.active_ads ?? fb.active_ads),
    impressions: Number(inner.impressions ?? fb.impressions),
    source: typeof inner.source === "string" ? inner.source : fb.source,
  };
}

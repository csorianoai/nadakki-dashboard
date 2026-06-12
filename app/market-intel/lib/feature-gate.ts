/**
 * MEE route gating — fail-closed until explicitly enabled.
 *
 * Production default: unset / not "true" → /market-intel returns 404 (notFound).
 * No sidebar entry is registered for this route (see forge-global-sidebar-nav).
 *
 * Pair with NEXT_PUBLIC_MARKET_INTEL_USE_FIXTURES=true only on preview/dev builds;
 * live API errors must NOT silently serve fixtures (see api.ts withFixtureFallback).
 */
export function isMarketIntelEnabled(): boolean {
  return process.env.NEXT_PUBLIC_FEATURE_MARKET_INTEL === "true";
}

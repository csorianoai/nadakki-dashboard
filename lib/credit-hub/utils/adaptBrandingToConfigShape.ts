import { getDefaultTenantBankingConfig } from "@/lib/credit-hub/hooks/useTenantConfig";
import type { TenantBranding } from "@/lib/credit-hub/types/tenantBranding";
import type { TenantBankingConfig } from "@/lib/credit-hub/types/tenantConfig";

// HISTORICAL NOTE: TenantConfig.primary_color was originally
// placeholder "#ff6b35" never consumed in production.
// Confirmed via grep 2026-05-09: only 4 reads of branding.*
// in Forge codebase, all on branding.logo_url. CSS institutional
// colors apply via [data-tenant] in tokens.css, not JS.
// See _design/P10-05_ADAPTER_ANALYSIS.md §1 for evidence.

/**
 * Currency code → display symbol lookup. Limited to currencies the platform
 * actively supports. Unknown codes fall back to the DR default ("RD$") so
 * partial banking-policy data still renders coherently in the chrome.
 */
const CURRENCY_SYMBOLS: Record<string, string> = {
  DOP: "RD$",
  USD: "$",
  MXN: "MX$",
  BOB: "Bs",
  COP: "COL$",
  PEN: "S/",
};

/**
 * Parses the country segment from a BCP 47 locale tag (e.g. "es-DO" → "DO").
 * Returns "DO" when the locale is malformed (single segment, empty, etc.)
 * to keep downstream consumers stable until P10-09 adds richer policy data.
 */
function deriveCountryCodeFromLocale(
  locale: string,
): TenantBankingConfig["country_code"] {
  const parts = locale.split("-");
  if (parts.length !== 2 || !parts[1]) return "DO";
  return parts[1] as TenantBankingConfig["country_code"];
}

/**
 * Pure adapter that produces the wide `TenantBankingConfig` shape consumed
 * by ~30 legacy call-sites from the narrower `TenantBranding` chrome payload
 * fetched by `useTenantBranding`.
 *
 * Behaviour:
 * - Chrome fields (institution_name, locale, currency, branding.*, etc.)
 *   are sourced from `branding`.
 * - Banking policy fields (ltv_max, dti_max, allowed_terms, document_types,
 *   features_enabled, etc.) are preserved from
 *   `getDefaultTenantBankingConfig()` until P10-09 adds a real banking
 *   policy endpoint.
 * - `accent_color` mirrors `brand_primary` (TestBank pattern; no Forge
 *   consumer reads this field today).
 *
 * @param branding - response from GET /api/v2/tenants/{id}/branding
 * @param tenantId - effective tenant id (from session/JWT)
 * @returns a fully populated `TenantBankingConfig` ready for the proxy hook
 *
 * @example
 *   const cfg = adaptBrandingToConfigShape(brandingPayload, "credicefi");
 *   cfg.institution_name; // "Credicefi"
 *   cfg.currency_symbol;  // "RD$"
 *   cfg.dti_max;          // 0.4 (default; P10-09 territory)
 */
export function adaptBrandingToConfigShape(
  branding: TenantBranding,
  tenantId: string,
): TenantBankingConfig {
  const defaults = getDefaultTenantBankingConfig(tenantId);

  return {
    ...defaults, // banking policy stays default (P10-09 territory)
    tenant_id: branding.tenant_id,
    institution_name: branding.display_name,
    country_code: deriveCountryCodeFromLocale(branding.locale),
    currency_code: branding.currency,
    currency_symbol:
      CURRENCY_SYMBOLS[branding.currency] ?? defaults.currency_symbol,
    locale: branding.locale,
    regulatory_profile: branding.regulatory_profile,
    branding: {
      logo_url: branding.logo_url ?? null,
      primary_color: branding.brand_primary,
      secondary_color: branding.brand_dark,
      // TestBank pattern: accent === primary; no Forge consumer reads this.
      accent_color: branding.brand_primary,
    },
  };
}

"use client";

/**
 * IMPORT CYCLE WARNING:
 * This file imports adaptBrandingToConfigShape and warnOnceForCaller.
 * Both export function declarations (hoisted at parse time), allowing
 * the cycle to resolve. If you ever convert these to const/arrow
 * exports, the cycle will break at runtime. Keep them as
 * function declarations.
 *
 * If you need to refactor: split this file so the proxy logic
 * lives in a separate module that imports the adapter, breaking
 * the cycle at the file boundary.
 */

import { useMemo } from "react";
import { getForgeTestTenantBankingConfig } from "@/lib/credit-hub/forge-test-tenant-override";
import { adaptBrandingToConfigShape } from "@/lib/credit-hub/utils/adaptBrandingToConfigShape";
import { warnOnceForCaller } from "@/lib/credit-hub/utils/warnOnceForCaller";
import { useTenant } from "./useTenant";
import { useTenantBranding } from "./useTenantBranding";
import { DEFAULT_DO_REQUIRED_DOCUMENTS } from "@/lib/credit-hub/defaults/do-required-documents";
import type { TenantBankingConfig } from "../types/tenantConfig";

/** Valores por defecto RepÃºblica Dominicana â€” simulador y polÃ­ticas de exhibiciÃ³n en tenant. */
const DEFAULT_DO_SIMULATOR_CONFIG: Pick<
  TenantBankingConfig,
  | "default_rate"
  | "min_rate"
  | "max_rate"
  | "allowed_terms"
  | "default_term"
  | "product_limits"
  | "dti_warning_ratio"
  | "dti_max"
  | "ltv_max"
  | "min_roi_threshold"
  | "risk_multipliers"
  | "payment_capacity_ratio"
> = {
  default_rate: 16,
  min_rate: 10,
  max_rate: 25,
  allowed_terms: [12, 24, 36, 48, 60, 72, 84],
  default_term: 60,
  product_limits: {
    min_loan: 100_000,
    max_loan: 5_000_000,
    min_down_payment_ratio: 0.1,
    max_ltv: 0.95,
  },
  dti_warning_ratio: 0.85,
  dti_max: 0.4,
  ltv_max: 0.95,
  min_roi_threshold: 30,
  risk_multipliers: { BAJO: 1.0, MEDIO: 0.75, ALTO: 0.5 },
  payment_capacity_ratio: 0.4,
};

/**
 * Returns the canonical Dominican-Republic baseline `TenantBankingConfig`
 * used as the fallback whenever the tenant-branding fetch is loading,
 * errored, or returns a partial response. **Do not modify** â€” the parity
 * test in `__tests__/adaptBrandingToConfigShape.test.ts` depends on these
 * exact defaults.
 *
 * @param tenantId - the effective tenant id (used only to populate
 *                   `tenant_id` on the returned object)
 */
export function getDefaultTenantBankingConfig(tenantId: string): TenantBankingConfig {
  return {
    tenant_id: tenantId,
    institution_name: "InstituciÃ³n financiera",
    institution_type: "FINANCIAL_INSTITUTION",
    country_code: "DO",
    currency_code: "DOP",
    currency_symbol: "RD$",
    locale: "es-DO",
    regulatory_profile: "DO_LEY_172_13",
    branding: {
      logo_url: null,
      primary_color: "#ff6b35",
      secondary_color: "#0f172a",
      accent_color: "#2563eb",
    },
    scoring_thresholds: { excellent: 800, good: 700, fair: 580 },
    vehicle_types: ["Nuevo", "Usado", "Demo"],
    product_types: ["VehÃ­culo nuevo", "VehÃ­culo usado", "Motor", "CamiÃ³n", "Maquinaria", "Otro"],
    document_types: { primary_id: "CEDULA", alternative_ids: ["PASAPORTE", "OTRO"] },
    min_age: 18,
    max_age: 75,
    min_employment_years: 0.5,
    pii_masking_enabled: true,
    required_documents: [...DEFAULT_DO_REQUIRED_DOCUMENTS],
    features_enabled: {
      remote_consent: true,
      preapproval_simulator: true,
      garante_required: false,
    },
    consent_methods_enabled: ["WHATSAPP", "EMAIL", "SMS_OTP", "SELFIE"],
    ...DEFAULT_DO_SIMULATOR_CONFIG,
  };
}

/**
 * @deprecated Migrate to `useTenantBranding` for chrome fields, or to
 * `useTenantBankingPolicy` (P10-09 pending) for banking policy fields.
 * This hook proxies `useTenantBranding` for chrome and falls back to
 * defaults for banking policy.
 *
 * Behavior preserved verbatim from the legacy implementation:
 * - Returns the exact `{ tenantConfig, loading }` shape that all 30
 *   existing call-sites consume.
 * - The `NEXT_PUBLIC_FORGE_TEST_TENANT=mx` override path is honored
 *   first via `getForgeTestTenantBankingConfig()`, identical to before.
 * - Loading and error states resolve to the canonical default config so
 *   chrome consumers never crash.
 *
 * Logs a single dev-only `console.warn` per unique call site, surfacing
 * the deprecation without spamming the console.
 */
export function useTenantConfig(): { tenantConfig: TenantBankingConfig; loading: boolean } {
  const { tenantId, tenantSlug, loading: tenantLoading } = useTenant();
  // P10-05 BUG-001 fix: pass tenantSlug (resolved by useTenant), not tenantId
  // (UUID). Backend `/api/v2/tenants/{slug}/branding` keys by slug.
  const { data: branding, isPending } = useTenantBranding(tenantSlug);

  if (process.env.NODE_ENV !== "production") {
    warnOnceForCaller(
      "useTenantConfig is deprecated. Migrate to useTenantBranding for chrome fields (P10-05), or to useTenantBankingPolicy for banking policy (P10-09 pending).",
    );
  }

  const tenantConfig = useMemo<TenantBankingConfig>(() => {
    // Test override path preserved unchanged (NEXT_PUBLIC_FORGE_TEST_TENANT=mx).
    const test = getForgeTestTenantBankingConfig();
    if (test) return test;

    const effectiveTenantId = tenantId || "tenant-no-disponible";

    if (branding) {
      return adaptBrandingToConfigShape(branding, effectiveTenantId);
    }

    // Loading or error â†’ default. Banking policy is always default until P10-09.
    return getDefaultTenantBankingConfig(effectiveTenantId);
  }, [branding, tenantId]);

  return { tenantConfig, loading: tenantLoading || isPending };
}

export { DEFAULT_DO_REQUIRED_DOCUMENTS } from "@/lib/credit-hub/defaults/do-required-documents";

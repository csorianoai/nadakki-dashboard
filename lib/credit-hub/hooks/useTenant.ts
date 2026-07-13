"use client";

import { useTenant as useDashboardTenant } from "@/contexts/TenantContext";
import { FORGE_TEST_MX_TENANT_ID, isForgeMxTestTenantBuild } from "@/lib/credit-hub/forge-test-tenant-override";
import { resolveTenantSlug } from "../types/creditCore";

export type CreditHubTenant = {
  /** Session or env tenant id — null when unresolved (no silent UUID fallback). */
  tenantId: string | null;
  /** Same as tenantId; use for credit API calls. */
  apiTenantId: string | null;
  tenantSlug: string | null;
  loading: boolean;
};

export function useTenant(): CreditHubTenant {
  if (isForgeMxTestTenantBuild()) {
    return {
      tenantId: FORGE_TEST_MX_TENANT_ID,
      apiTenantId: FORGE_TEST_MX_TENANT_ID,
      tenantSlug: FORGE_TEST_MX_TENANT_ID,
      loading: false,
    };
  }
  const { tenantId: sessionTenantId } = useDashboardTenant();
  // Launch readiness P0: never fall back to env tenant in production builds.
  const envTenantId =
    process.env.NODE_ENV === "production"
      ? null
      : process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID?.trim() || null;
  const apiTenantId = sessionTenantId ?? envTenantId;
  const tenantSlug = apiTenantId ? resolveTenantSlug(apiTenantId) : null;
  return { tenantId: apiTenantId, apiTenantId, tenantSlug, loading: false };
}

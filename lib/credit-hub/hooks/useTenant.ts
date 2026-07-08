"use client";

import { useTenant as useDashboardTenant } from "@/contexts/TenantContext";
import { FORGE_TEST_MX_TENANT_ID, isForgeMxTestTenantBuild } from "@/lib/credit-hub/forge-test-tenant-override";
import { DEFAULT_CREDIT_TENANT_ID, resolveTenantSlug } from "../types/creditCore";

export type CreditHubTenant = {
  /** Resolved id for chrome/branding (may use dev fallback). */
  tenantId: string | null;
  /** Session or explicit env tenant — use for credit API calls (no silent UUID fallback). */
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
  const envTenantId = process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID?.trim() || null;
  const apiTenantId = sessionTenantId || envTenantId;
  const effectiveTenantId = apiTenantId || DEFAULT_CREDIT_TENANT_ID;
  const slug = resolveTenantSlug(effectiveTenantId);
  return { tenantId: effectiveTenantId, apiTenantId, tenantSlug: slug, loading: false };
}

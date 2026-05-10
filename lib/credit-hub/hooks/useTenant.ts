"use client";

import { useTenant as useDashboardTenant } from "@/contexts/TenantContext";
import { FORGE_TEST_MX_TENANT_ID, isForgeMxTestTenantBuild } from "@/lib/credit-hub/forge-test-tenant-override";
import { DEFAULT_CREDIT_TENANT_ID, resolveTenantSlug } from "../types/creditCore";

export function useTenant(): { tenantId: string | null; tenantSlug: string | null; loading: boolean } {
  if (isForgeMxTestTenantBuild()) {
    return { tenantId: FORGE_TEST_MX_TENANT_ID, tenantSlug: FORGE_TEST_MX_TENANT_ID, loading: false };
  }
  const { tenantId } = useDashboardTenant();
  const effectiveTenantId = tenantId || process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || DEFAULT_CREDIT_TENANT_ID;
  // P10-05 BUG-001 fix: backend `tenant_branding` table uses slug as PK,
  // but session/JWT carries UUID. Resolve UUID -> slug for branding lookups.
  const slug = resolveTenantSlug(effectiveTenantId);
  return { tenantId: effectiveTenantId, tenantSlug: slug, loading: false };
}

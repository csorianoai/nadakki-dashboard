"use client";

import { useTenant as useDashboardTenant } from "@/contexts/TenantContext";
import { DEFAULT_CREDIT_TENANT_ID } from "../types/creditCore";

export function useTenant(): { tenantId: string | null; tenantSlug: string | null; loading: boolean } {
  const { tenantId } = useDashboardTenant();
  const effectiveTenantId = tenantId || process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || DEFAULT_CREDIT_TENANT_ID;
  return { tenantId: effectiveTenantId, tenantSlug: effectiveTenantId, loading: false };
}

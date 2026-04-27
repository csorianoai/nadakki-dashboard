"use client";

import { useTenant as useDashboardTenant } from "@/contexts/TenantContext";

export function useTenant(): { tenantId: string | null; tenantSlug: string | null; loading: boolean } {
  const { tenantId } = useDashboardTenant();
  return { tenantId, tenantSlug: tenantId, loading: false };
}

"use client";

import { useTenant as useDashboardTenant } from "@/contexts/TenantContext";

export function useTenant(): { tenantId: string | null; loading: boolean } {
  const { tenantId } = useDashboardTenant();
  return { tenantId, loading: false };
}

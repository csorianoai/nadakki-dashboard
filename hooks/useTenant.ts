"use client";

import { useAuth } from "./useAuth";

export function useTenant() {
  const { tenant, switchTenant } = useAuth();
  const hasCoreAccess = (coreName: string): boolean => {
    if (!tenant) return false;
    return tenant.subscribed_cores.includes(coreName);
  };
  return {
    tenant,
    subscribedCores: tenant?.subscribed_cores || [],
    hasCoreAccess,
    switchTenant,
  };
}

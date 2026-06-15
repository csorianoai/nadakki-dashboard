"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/contexts/TenantContext";

const DEV_FALLBACK_TENANT =
  process.env.NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID?.trim() || "credicefi"
    : undefined;

export function useMarketIntelTenant(): {
  effectiveTenantId: string | undefined;
  tenantHydrated: boolean;
  tenantError: string | null;
} {
  const { tenant, isLoading: authLoading } = useAuth();
  const { tenantId: legacyTenantId } = useTenant();
  const [timeoutError, setTimeoutError] = useState<string | null>(null);

  const tid = useMemo(() => {
    const fromAuth = tenant?.id?.trim() ?? "";
    const fromLegacy = legacyTenantId?.trim() ?? "";
    return fromAuth || fromLegacy;
  }, [tenant?.id, legacyTenantId]);

  const tenantHydrated = !authLoading;

  useEffect(() => {
    if (!tenantHydrated) return;
    if (tid || DEV_FALLBACK_TENANT) {
      setTimeoutError(null);
      return;
    }
    const timer = setTimeout(() => {
      setTimeoutError("No se pudo determinar el tenant activo");
    }, 5000);
    return () => clearTimeout(timer);
  }, [tenantHydrated, tid]);

  const effectiveTenantId = useMemo(() => {
    if (tid) return tid;
    return DEV_FALLBACK_TENANT;
  }, [tid]);

  const tenantError = !effectiveTenantId && tenantHydrated ? timeoutError : null;

  return {
    effectiveTenantId,
    tenantHydrated,
    tenantError,
  };
}

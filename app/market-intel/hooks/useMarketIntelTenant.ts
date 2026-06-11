"use client";

import { useEffect, useMemo, useState } from "react";
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
  const { tenantId } = useTenant();
  const [hydrated, setHydrated] = useState(false);
  const [timeoutError, setTimeoutError] = useState<string | null>(null);
  const tid = tenantId?.trim() || "";

  useEffect(() => {
    const t = setTimeout(() => setHydrated(true), 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (tid || DEV_FALLBACK_TENANT) return;
    const timer = setTimeout(() => {
      setTimeoutError("No se pudo determinar el tenant activo");
    }, 5000);
    return () => clearTimeout(timer);
  }, [hydrated, tid]);

  const effectiveTenantId = useMemo(() => {
    if (tid) return tid;
    return DEV_FALLBACK_TENANT;
  }, [tid]);

  const tenantError = !effectiveTenantId && hydrated ? timeoutError : null;

  return {
    effectiveTenantId,
    tenantHydrated: hydrated,
    tenantError,
  };
}

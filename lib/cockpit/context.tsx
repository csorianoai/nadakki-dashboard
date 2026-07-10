"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/contexts/TenantContext";
import { useTenantBranding } from "@/lib/hooks/useTenantBranding";
import type { CockpitLevel } from "./types";

export type CockpitTenantFilter = string | null;

interface CockpitContextValue {
  tenantFilter: CockpitTenantFilter;
  setTenantFilter: (id: CockpitTenantFilter) => void;
  isPlatformSuperadmin: boolean;
  isTenantAdminOnly: boolean;
  locale: string;
  currency: string;
  level: CockpitLevel;
  setLevel: (l: CockpitLevel) => void;
}

const CockpitContext = createContext<CockpitContextValue | null>(null);

export function CockpitProvider({
  children,
  initialLevel = "network",
}: {
  children: ReactNode;
  initialLevel?: CockpitLevel;
}) {
  const { activeRole } = useAuth();
  const { tenantId } = useTenant();
  const { data: branding } = useTenantBranding();
  const [tenantFilter, setTenantFilterState] = useState<CockpitTenantFilter>(null);
  const [level, setLevel] = useState<CockpitLevel>(initialLevel);

  const roleKey = activeRole?.role_key ?? "";
  const isPlatformSuperadmin = roleKey === "platform_superadmin";
  const isTenantAdminOnly = roleKey === "tenant_admin" && !isPlatformSuperadmin;

  const setTenantFilter = useCallback(
    (id: CockpitTenantFilter) => {
      if (isTenantAdminOnly && tenantId) {
        setTenantFilterState(tenantId);
        return;
      }
      setTenantFilterState(id);
    },
    [isTenantAdminOnly, tenantId],
  );

  const locale = branding?.locale ?? "es-DO";
  const currency = branding?.currency ?? "DOP";

  const value = useMemo(
    () => ({
      tenantFilter: isTenantAdminOnly ? tenantId : tenantFilter,
      setTenantFilter,
      isPlatformSuperadmin,
      isTenantAdminOnly,
      locale,
      currency,
      level,
      setLevel,
    }),
    [
      tenantFilter,
      setTenantFilter,
      isPlatformSuperadmin,
      isTenantAdminOnly,
      tenantId,
      locale,
      currency,
      level,
    ],
  );

  return <CockpitContext.Provider value={value}>{children}</CockpitContext.Provider>;
}

export function useCockpit(): CockpitContextValue {
  const ctx = useContext(CockpitContext);
  if (!ctx) throw new Error("useCockpit must be used within CockpitProvider");
  return ctx;
}

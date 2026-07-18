"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  cleanupLegacyAutosDocumentAttrs,
  getAutosPortalElement,
} from "@/components/system/autos-portal-scope";
import {
  isTenantSlug,
  TENANTS,
  type TenantConfig,
  type TenantSlug,
} from "@/lib/tenants";

type TenantContextValue = {
  tenant: TenantSlug;
  config: TenantConfig;
  setTenant: (slug: TenantSlug) => void;
};

const TenantContext = createContext<TenantContextValue | null>(null);
const STORAGE_KEY = "nadakki-autos-tenant";

function applyTenantToPortal(slug: TenantSlug) {
  if (typeof document === "undefined") return;
  cleanupLegacyAutosDocumentAttrs();
  getAutosPortalElement()?.setAttribute("data-tenant", slug);
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenantState] = useState<TenantSlug>("nadakki");

  useEffect(() => {
    cleanupLegacyAutosDocumentAttrs();
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (isTenantSlug(stored)) {
        setTenantState(stored);
        applyTenantToPortal(stored);
        return;
      }
    } catch {
      /* ignore */
    }
    applyTenantToPortal("nadakki");
  }, []);

  const setTenant = useCallback((slug: TenantSlug) => {
    setTenantState(slug);
    applyTenantToPortal(slug);
    try {
      localStorage.setItem(STORAGE_KEY, slug);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({
      tenant,
      config: TENANTS[tenant],
      setTenant,
    }),
    [tenant, setTenant],
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant(): TenantContextValue {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    throw new Error("useTenant must be used within TenantProvider");
  }
  return ctx;
}

"use client";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface TenantContextType {
  tenantId: string;
  setTenantId: (id: string) => void;
  tenantName: string;
  setTenantName: (name: string) => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children, initialTenant = "default" }: { children: ReactNode; initialTenant?: string }) {
  const [tenantId, setTenantId] = useState(initialTenant);
  const [tenantName, setTenantName] = useState("Default Organization");

  return (
    <TenantContext.Provider value={{ tenantId, setTenantId, tenantName, setTenantName }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    return { tenantId: "default", setTenantId: () => {}, tenantName: "Default", setTenantName: () => {} };
  }
  return context;
}

export default TenantContext;
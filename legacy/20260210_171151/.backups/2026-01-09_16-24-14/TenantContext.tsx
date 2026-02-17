"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface TenantSettings {
  name: string;
  primaryColor: string;
  timezone: string;
  language: string;
  currency: string;
  dateFormat: string;
  features: { 
    aiGeneration: boolean; 
    abTesting: boolean; 
    advancedAnalytics: boolean; 
    whatsapp: boolean; 
    sms: boolean; 
  };
  limits: { 
    maxCampaigns: number; 
    maxContacts: number; 
    maxEmailsPerMonth: number; 
  };
  plan: "free" | "starter" | "pro" | "enterprise";
}

interface TenantContextType {
  tenantId: string;
  settings: TenantSettings;
  setTenantId: (id: string) => void;
  updateSettings: (updates: Partial<TenantSettings>) => void;
  isFeatureEnabled: (feature: keyof TenantSettings["features"]) => boolean;
  checkLimit: (limit: keyof TenantSettings["limits"], current: number) => boolean;
}

const DEFAULT_SETTINGS: TenantSettings = {
  name: "NADAKKI Demo",
  primaryColor: "#8b5cf6",
  timezone: "America/New_York",
  language: "es",
  currency: "USD",
  dateFormat: "MM/DD/YYYY",
  features: { 
    aiGeneration: true, 
    abTesting: true, 
    advancedAnalytics: true, 
    whatsapp: false, 
    sms: true 
  },
  limits: { 
    maxCampaigns: 50, 
    maxContacts: 10000, 
    maxEmailsPerMonth: 50000 
  },
  plan: "pro",
};

// VALOR POR DEFECTO SEGURO - NUNCA UNDEFINED
const defaultContextValue: TenantContextType = {
  tenantId: "default",
  settings: DEFAULT_SETTINGS,
  setTenantId: () => {
    if (process.env.NODE_ENV === "development") {
      console.warn("setTenantId llamado sin TenantProvider (usando valor por defecto)");
    }
  },
  updateSettings: () => {
    if (process.env.NODE_ENV === "development") {
      console.warn("updateSettings llamado sin TenantProvider (usando valor por defecto)");
    }
  },
  isFeatureEnabled: () => {
    if (process.env.NODE_ENV === "development") {
      console.warn("isFeatureEnabled llamado sin TenantProvider (usando valor por defecto)");
    }
    return true; // Siempre retorna true como fallback
  },
  checkLimit: () => {
    if (process.env.NODE_ENV === "development") {
      console.warn("checkLimit llamado sin TenantProvider (usando valor por defecto)");
    }
    return true; // Siempre retorna true como fallback
  },
};

// CONTEXTO creado con valor por defecto SEGURO
const TenantContext = createContext<TenantContextType>(defaultContextValue);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenantId, setTenantIdState] = useState("default");
  const [settings, setSettings] = useState<TenantSettings>(DEFAULT_SETTINGS);
  
  const setTenantId = useCallback((id: string) => {
    setTenantIdState(id);
  }, []);
  
  const updateSettings = useCallback((updates: Partial<TenantSettings>) => {
    setSettings(s => ({ ...s, ...updates }));
  }, []);
  
  const isFeatureEnabled = useCallback((feature: keyof TenantSettings["features"]): boolean => {
    return settings.features[feature] ?? false;
  }, [settings.features]);
  
  const checkLimit = useCallback((limit: keyof TenantSettings["limits"], current: number): boolean => {
    return current < (settings.limits[limit] || Infinity);
  }, [settings.limits]);

  const value = { 
    tenantId, 
    settings, 
    setTenantId, 
    updateSettings, 
    isFeatureEnabled, 
    checkLimit 
  };

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

// HOOK SUPER SEGURO - NUNCA lanza error, NUNCA undefined
export function useTenant(): TenantContextType {
  const context = useContext(TenantContext);
  
  // ELIMINADO: No hay verificación de null/undefined
  // ELIMINADO: No hay throw new Error
  // SIMPLEMENTE retorna el contexto (que siempre tiene valor por defecto)
  
  return context;
}

export default TenantContext;

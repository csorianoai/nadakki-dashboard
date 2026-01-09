"use client";

// hooks/useTenantServer.ts
// Hook seguro para Server Components - NO usa React Context

import { DEFAULT_SETTINGS } from '@/contexts/TenantContext';

export type TenantSettings = {
  name: string;
  features: {
    email: boolean;
    push: boolean;
    advancedAnalytics: boolean;
    whatsapp: boolean;
    sms: boolean;
  };
  limits: {
    maxCampaigns: number;
    maxContacts: number;
    maxEmailsPerMonth: number;
  };
  plan: string;
};

export type TenantData = {
  tenantId: string;
  settings: TenantSettings;
  isFeatureEnabled: (feature: keyof TenantSettings['features']) => boolean;
  checkLimit: (limit: keyof TenantSettings['limits'], current: number) => boolean;
  isLoading: boolean;
  source: 'server' | 'client';
};

/**
 * Hook para Server Components - No depende de React Context
 * Solo lee de cookies/headers/database
 */
export async function useTenantServer(): Promise<TenantData> {
  // En server components, obtenemos tenant de cookies/headers
  // Esta función es ASÍNCRONA y no usa React hooks
  
  // TODO: Implementar lógica real de obtención de tenant
  // Por ahora retorna valores por defecto
  
  return {
    tenantId: "default",
    settings: DEFAULT_SETTINGS,
    isFeatureEnabled: (feature) => DEFAULT_SETTINGS.features[feature] ?? false,
    checkLimit: (limit, current) => current < DEFAULT_SETTINGS.limits[limit],
    isLoading: false,
    source: 'server',
  };
}

/**
 * Versión síncrona para Client Components que puedan importar desde server
 */
export function getTenantData(): TenantData {
  return {
    tenantId: "default",
    settings: DEFAULT_SETTINGS,
    isFeatureEnabled: (feature) => DEFAULT_SETTINGS.features[feature] ?? false,
    checkLimit: (limit, current) => current < DEFAULT_SETTINGS.limits[limit],
    isLoading: false,
    source: 'client',
  };
}

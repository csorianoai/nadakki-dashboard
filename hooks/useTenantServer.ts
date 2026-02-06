// Hook seguro para Server Components - NO usa React Context

export type TenantSettings = {
  name: string;
  plan: string;
  features: Record<string, boolean>;
  limits: Record<string, number>;
};

// ✅ DEFINIDO ANTES DE USARSE
export const DEFAULT_SETTINGS: TenantSettings = {
  name: "Default Tenant",
  plan: "base",
  features: {
    aiAgents: true,
    analytics: true,
    multiTenant: true,
    apiAccess: true,
    customDomains: false,
    prioritySupport: false,
  },
  limits: {
    agents: 1000,
    users: 50,
    requestsPerDay: 10000,
    storageMB: 1024,
    workspaces: 5,
  },
};

export type TenantContextType = {
  tenantId: string | null;
  settings: TenantSettings;
  isFeatureEnabled: (feature: string) => boolean;
  checkLimit: (limit: string, current: number) => boolean;
  isLoading: boolean;
};

export function useTenantServer(): TenantContextType {
  // Server-safe: NO context, NO hooks, NO browser APIs.
  // En producción: aquí se reemplaza por fetch a DB/API según tenant.

  return {
    tenantId: "default",
    settings: DEFAULT_SETTINGS,
    isFeatureEnabled: (feature) => DEFAULT_SETTINGS.features[feature] ?? false,
    checkLimit: (limit, current) => current < (DEFAULT_SETTINGS.limits[limit] ?? Number.POSITIVE_INFINITY),
    isLoading: false,
  };
}

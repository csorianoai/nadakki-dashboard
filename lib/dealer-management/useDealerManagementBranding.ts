"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api/fetch-client";
import type { TenantBranding } from "@/lib/credit-hub/types/tenantBranding";

export function useDealerManagementBranding() {
  const auth = useAuth();

  return useQuery<TenantBranding | null, Error>({
    queryKey: ["dealer-management-branding", auth.tenantId || "none"],
    queryFn: async () => {
      if (!auth.tenantId) return null;
      const response = await apiFetch(
        `/api/v2/tenants/${encodeURIComponent(auth.tenantId)}/branding`,
        { headers: { Accept: "application/json" } },
      );
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`Branding fetch failed (${response.status})`);
      return (await response.json()) as TenantBranding;
    },
    enabled: Boolean(auth.isAuthenticated && auth.tenantId),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

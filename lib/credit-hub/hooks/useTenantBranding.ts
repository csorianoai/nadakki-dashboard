"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchTenantBranding } from "@/lib/credit-hub/api/tenant-branding-client";
import type { UseQueryResult } from "@tanstack/react-query";
import type { TenantBranding } from "@/lib/credit-hub/types/tenantBranding";

/**
 * Fetches tenant branding from API and caches via react-query.
 *
 * @param tenantId - Tenant identifier from session/JWT
 * @returns query result with TenantBranding data + loading/error states
 *
 * Configuration rationale:
 * - staleTime 5min: branding rarely changes mid-session
 * - gcTime 30min: keep in cache for tenant switches
 * - retry 2 with 1s delay: tolerate transient network blips
 * - refetchOnWindowFocus false: branding does not change while
 *   user is actively working
 * - refetchOnReconnect true: refresh after network recovery to
 *   ensure post-outage consistency
 */
export function useTenantBranding(
  tenantId: string | null,
): UseQueryResult<TenantBranding, Error> {
  return useQuery<TenantBranding, Error>({
    queryKey: ["tenant-branding", tenantId],
    queryFn: () => fetchTenantBranding(tenantId as string),
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
}

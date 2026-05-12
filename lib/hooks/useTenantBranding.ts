"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { tokenStorage } from "@/lib/auth/token-storage";
import type { TenantBranding } from "@/lib/credit-hub/types/tenantBranding";

export const tenantBrandingAuthQueryKey = ["tenant-branding-auth"] as const;

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_NADAKKI_API_BASE ||
  "";

/**
 * Fetches institution branding via Auth V2 JWT (not SIC/localStorage legacy token).
 * Path uses `tenant.id` plus `tenant.slug` as fallback identifier for backends that register by slug or UUID.
 */
export function useTenantBranding(): UseQueryResult<TenantBranding | null, Error> {
  const { tenant, isAuthenticated } = useAuth();

  const tenantKey = tenant?.id ?? tenant?.slug ?? "";

  return useQuery<TenantBranding | null, Error>({
    queryKey: [...tenantBrandingAuthQueryKey, tenantKey],
    queryFn: async () => {
      const token = tokenStorage.getAccessToken();
      const idForPath = tenant?.id ?? tenant?.slug;
      if (!idForPath || !token || !API_BASE.trim()) return null;

      const res = await fetch(
        `${API_BASE.replace(/\/$/, "")}/api/v2/tenants/${encodeURIComponent(idForPath)}/branding`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );

      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`Branding fetch failed (${res.status})`);
      return (await res.json()) as TenantBranding;
    },
    enabled: Boolean(isAuthenticated && tenantKey && API_BASE.trim()),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

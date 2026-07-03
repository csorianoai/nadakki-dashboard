"use client";

import { useQuery } from "@tanstack/react-query";
import type { TenantBranding } from "@/lib/credit-hub/types/tenantBranding";

export const publicTenantBrandingQueryKey = ["public-tenant-branding"] as const;

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_NADAKKI_API_BASE ||
  "";

function resolveBrandingUrl(slug: string): string {
  const path = `/api/v2/tenants/${encodeURIComponent(slug)}/branding`;
  if (typeof window !== "undefined") return path;
  const base = API_BASE.trim().replace(/\/$/, "");
  return base ? `${base}${path}` : path;
}

/**
 * Pre-auth branding fetch for login / public surfaces.
 * Uses same-origin relative URL in browser (Next rewrite → Render).
 * Returns null on 401/404 — caller must use neutral fallback.
 */
export function usePublicTenantBrandingBySlug(tenantSlug: string | undefined) {
  const slug = tenantSlug?.trim() ?? "";

  return useQuery<TenantBranding | null, Error>({
    queryKey: [...publicTenantBrandingQueryKey, slug],
    queryFn: async () => {
      if (!slug) return null;
      const res = await fetch(resolveBrandingUrl(slug), {
        headers: { Accept: "application/json" },
      });
      if (res.status === 404 || res.status === 401 || res.status === 403) return null;
      if (!res.ok) throw new Error(`Branding fetch failed (${res.status})`);
      return (await res.json()) as TenantBranding;
    },
    enabled: slug.length >= 2,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

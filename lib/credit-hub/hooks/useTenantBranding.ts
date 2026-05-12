"use client";

/**
 * Bridges legacy callers that pass slug/tenant id — Auth V2 + JWT Bearer
 * fetch is authoritative (see `@/lib/hooks/useTenantBranding`).
 */

import type { UseQueryResult } from "@tanstack/react-query";
import type { TenantBranding } from "@/lib/credit-hub/types/tenantBranding";
import { useTenantBranding as useAuthTenantBranding } from "@/lib/hooks/useTenantBranding";

export function useTenantBranding(_tenantSlug: string | null): UseQueryResult<TenantBranding | null, Error> {
  return useAuthTenantBranding();
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { getRiskDistributions } from "../api/analyticsClient";
import { ANALYTICS_QUERY_OPTIONS } from "./analyticsQueryOptions";
import { chKeys } from "./queryKeys";
import { useTenant } from "./useTenant";

export function useRiskDistributions() {
  const { apiTenantId } = useTenant();
  return useQuery({
    queryKey: chKeys.riskDistributions(apiTenantId ?? ""),
    queryFn: () => getRiskDistributions({ tenantId: apiTenantId! }),
    enabled: !!apiTenantId,
    staleTime: 60_000,
    ...ANALYTICS_QUERY_OPTIONS,
  });
}

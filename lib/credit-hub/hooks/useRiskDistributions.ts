"use client";

import { useQuery } from "@tanstack/react-query";
import { getRiskDistributions } from "../api/analyticsClient";
import { ANALYTICS_QUERY_OPTIONS } from "./analyticsQueryOptions";
import { chKeys } from "./queryKeys";
import { useTenant } from "./useTenant";

export function useRiskDistributions() {
  const { tenantId } = useTenant();
  return useQuery({
    queryKey: chKeys.riskDistributions(tenantId ?? ""),
    queryFn: () => getRiskDistributions({ tenantId: tenantId! }),
    enabled: !!tenantId,
    staleTime: 60_000,
    ...ANALYTICS_QUERY_OPTIONS,
  });
}

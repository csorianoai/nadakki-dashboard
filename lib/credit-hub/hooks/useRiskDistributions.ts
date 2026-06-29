"use client";

import { useQuery } from "@tanstack/react-query";
import { getRiskDistributions } from "../api/analyticsClient";
import { chKeys } from "./queryKeys";
import { useTenant } from "./useTenant";

export function useRiskDistributions() {
  const { tenantId } = useTenant();
  return useQuery({
    queryKey: chKeys.riskDistributions(tenantId ?? ""),
    queryFn: () => getRiskDistributions({ tenantId: tenantId! }),
    enabled: !!tenantId,
    retry: 1,
    staleTime: 60_000,
  });
}

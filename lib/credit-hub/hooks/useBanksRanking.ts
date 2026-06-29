"use client";

import { useQuery } from "@tanstack/react-query";
import { getBanksRanking } from "../api/analyticsClient";
import { ANALYTICS_QUERY_OPTIONS } from "./analyticsQueryOptions";
import { chKeys } from "./queryKeys";
import { useTenant } from "./useTenant";

export function useBanksRanking() {
  const { tenantId } = useTenant();
  return useQuery({
    queryKey: chKeys.banksRanking(tenantId ?? ""),
    queryFn: () => getBanksRanking({ tenantId: tenantId! }),
    enabled: !!tenantId,
    staleTime: 60_000,
    ...ANALYTICS_QUERY_OPTIONS,
  });
}

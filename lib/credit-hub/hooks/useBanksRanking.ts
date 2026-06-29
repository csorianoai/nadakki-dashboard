"use client";

import { useQuery } from "@tanstack/react-query";
import { getBanksRanking } from "../api/analyticsClient";
import { chKeys } from "./queryKeys";
import { useTenant } from "./useTenant";

export function useBanksRanking() {
  const { tenantId } = useTenant();
  return useQuery({
    queryKey: chKeys.banksRanking(tenantId ?? ""),
    queryFn: () => getBanksRanking({ tenantId: tenantId! }),
    enabled: !!tenantId,
    retry: 1,
    staleTime: 60_000,
  });
}

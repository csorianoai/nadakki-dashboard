"use client";

import { useQuery } from "@tanstack/react-query";
import { getCreditStats } from "../api/creditCoreClient";
import { chKeys } from "./queryKeys";
import { useTenant } from "./useTenant";

export function useCreditStats() {
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: chKeys.creditCoreStats(tenantId ?? ""),
    queryFn: () => getCreditStats({ tenantId: tenantId! }),
    enabled: !!tenantId,
    retry: 1,
    staleTime: 30_000,
  });
}

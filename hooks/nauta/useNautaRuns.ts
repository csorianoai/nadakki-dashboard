"use client";

import { useQuery } from "@tanstack/react-query";
import { getRuns } from "@/lib/nauta/nautaClient";
import { nautaKeys } from "@/lib/nauta/queryKeys";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";

const DEFAULT_LIMIT = 20;

export function useNautaRuns(page = 1, limit = DEFAULT_LIMIT) {
  const { tenantId } = useTenant();
  return useQuery({
    queryKey: nautaKeys.runs(tenantId ?? "", page, limit),
    queryFn: () => getRuns({ page, limit }),
    enabled: !!tenantId,
    retry: 1,
    staleTime: 15_000,
  });
}

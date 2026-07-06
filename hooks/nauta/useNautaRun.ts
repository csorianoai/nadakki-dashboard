"use client";

import { useQuery } from "@tanstack/react-query";
import { getRun } from "@/lib/nauta/nautaClient";
import { nautaKeys } from "@/lib/nauta/queryKeys";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";

export function useNautaRun(runId: string | null | undefined) {
  const { tenantId } = useTenant();
  return useQuery({
    queryKey: nautaKeys.run(tenantId ?? "", runId ?? ""),
    queryFn: () => getRun({ runId: runId! }),
    enabled: !!tenantId && !!runId,
    retry: 1,
    staleTime: 15_000,
  });
}

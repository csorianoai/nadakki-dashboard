"use client";

import { useQuery } from "@tanstack/react-query";
import { getEvidence } from "@/lib/nauta/nautaClient";
import { nautaKeys } from "@/lib/nauta/queryKeys";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";

export function useNautaEvidence(runId: string | null | undefined) {
  const { tenantId } = useTenant();
  return useQuery({
    queryKey: nautaKeys.evidence(tenantId ?? "", runId ?? ""),
    queryFn: () => getEvidence({ runId: runId! }),
    enabled: !!tenantId && !!runId,
    retry: 1,
    staleTime: 15_000,
  });
}

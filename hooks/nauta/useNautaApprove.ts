"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { approveRun } from "@/lib/nauta/nautaClient";
import { nautaKeys } from "@/lib/nauta/queryKeys";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";

export function useNautaApprove(runId: string | null | undefined) {
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => approveRun({ runId: runId! }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["nauta", "runs", tenantId ?? ""] }),
        queryClient.invalidateQueries({ queryKey: nautaKeys.run(tenantId ?? "", runId ?? "") }),
      ]);
    },
  });
}

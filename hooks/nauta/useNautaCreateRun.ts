"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createRun, type CreateRunPayload } from "@/lib/nauta/nautaClient";
import { nautaKeys } from "@/lib/nauta/queryKeys";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";

export function useNautaCreateRun() {
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateRunPayload) => createRun(body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["nauta", "runs", tenantId ?? ""] });
    },
  });
}

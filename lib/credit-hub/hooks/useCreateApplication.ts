"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createApplication } from "../api/applications";
import type { CHCreateApplicationRequest } from "../types/_generated";
import { useActorRole } from "./useActorRole";
import { chKeys } from "./queryKeys";
import { useTenant } from "./useTenant";

export function useCreateApplication() {
  const { tenantId } = useTenant();
  const { actorRole } = useActorRole();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (body: CHCreateApplicationRequest) =>
      createApplication({
        tenantId: tenantId!,
        actorRole: actorRole ?? "dealer",
        body,
      }),
    onSuccess: () => {
      if (tenantId) {
        void qc.invalidateQueries({ queryKey: chKeys.applications(tenantId) });
      }
    },
  });
}

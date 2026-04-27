"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { processApplication } from "../api/creditCoreClient";
import { chKeys } from "./queryKeys";
import { useTenant } from "./useTenant";

export function useProcessCreditApplication(applicationId: string | null | undefined) {
  const { tenantId } = useTenant();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (mode?: string) =>
      processApplication({
        tenantId: tenantId!,
        applicationId: applicationId!,
        mode,
      }),
    onSuccess: () => {
      if (!tenantId || !applicationId) return;
      void qc.invalidateQueries({ queryKey: chKeys.creditCoreApplication(tenantId, applicationId) });
      void qc.invalidateQueries({ queryKey: chKeys.creditCoreEvents(tenantId, applicationId) });
      void qc.invalidateQueries({ queryKey: chKeys.creditCoreApplications(tenantId) });
      void qc.invalidateQueries({ queryKey: chKeys.creditCoreStats(tenantId) });
    },
  });
}

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createApplication } from "../api/creditCoreClient";
import type { CreateCreditApplicationPayload } from "../types/creditCore";
import { chKeys } from "./queryKeys";
import { useTenant } from "./useTenant";

export function useCreateCreditApplication() {
  const { tenantId } = useTenant();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCreditApplicationPayload) =>
      createApplication({
        tenantId: tenantId!,
        payload,
      }),
    onSuccess: (application) => {
      if (!tenantId) return;
      void qc.invalidateQueries({ queryKey: chKeys.creditCoreApplications(tenantId) });
      void qc.invalidateQueries({ queryKey: chKeys.creditCoreStats(tenantId) });
      void qc.invalidateQueries({ queryKey: chKeys.creditCoreApplication(tenantId, application.application_id) });
    },
  });
}

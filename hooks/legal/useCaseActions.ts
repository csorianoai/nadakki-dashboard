"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAvailableActions,
  patchCaseState,
  postCaseAction,
} from "@/lib/legal/cases/legal-cases-api";

export function useCaseActions(tenantId: string | undefined, caseId: string | undefined) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["legal_case_actions", tenantId ?? "", caseId ?? ""],
    enabled: Boolean(tenantId?.trim() && caseId?.trim()),
    queryFn: async () => fetchAvailableActions(tenantId!, caseId!),
  });
  const run = useMutation({
    mutationFn: async ({
      actionName,
      payload,
    }: {
      actionName: string;
      payload?: Record<string, unknown>;
    }) => postCaseAction(tenantId!, caseId!, actionName, payload ?? {}),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["legal_case", tenantId, caseId] });
      await qc.invalidateQueries({ queryKey: ["legal_case_actions", tenantId, caseId] });
    },
  });
  const transition = useMutation({
    mutationFn: async ({ newState, reason }: { newState: string; reason: string }) =>
      patchCaseState(tenantId!, caseId!, { new_state: newState, reason }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["legal_case", tenantId, caseId] });
      await qc.invalidateQueries({ queryKey: ["legal_case_actions", tenantId, caseId] });
    },
  });
  return {
    ...q,
    runAction: run.mutateAsync,
    runTransition: transition.mutateAsync,
    running: run.isPending || transition.isPending,
  };
}

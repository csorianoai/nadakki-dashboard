"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchDeadlines, postDeadlineOverride } from "@/lib/legal/cases/legal-cases-api";

export function useCaseDeadlines(tenantId: string | undefined, caseId: string | undefined) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["legal_case_deadlines", tenantId ?? "", caseId ?? ""],
    enabled: Boolean(tenantId?.trim() && caseId?.trim()),
    queryFn: async () => fetchDeadlines(tenantId!, caseId!),
  });
  const override = useMutation({
    mutationFn: async (args: {
      deadlineId: string;
      new_deadline_date: string;
      reason: string;
      legal_basis: string;
    }) =>
      postDeadlineOverride(tenantId!, caseId!, args.deadlineId, {
        new_deadline_date: args.new_deadline_date,
        reason: args.reason,
        legal_basis: args.legal_basis,
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["legal_case_deadlines", tenantId, caseId] });
      await qc.invalidateQueries({ queryKey: ["legal_case", tenantId, caseId] });
    },
  });
  return { ...q, overrideDeadline: override.mutateAsync, overriding: override.isPending };
}

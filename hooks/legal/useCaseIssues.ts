"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchIssues, patchIssue, postIssue } from "@/lib/legal/cases/legal-cases-api";
import type { CaseIssue } from "@/lib/legal/cases/case-types";

export function useCaseIssues(tenantId: string | undefined, caseId: string | undefined) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["legal_case_issues", tenantId ?? "", caseId ?? ""],
    enabled: Boolean(tenantId?.trim() && caseId?.trim()),
    queryFn: async () => {
      const { issues } = await fetchIssues(tenantId!, caseId!);
      return { issues: issues as CaseIssue[] };
    },
  });
  const create = useMutation({
    mutationFn: async (body: Record<string, unknown>) => postIssue(tenantId!, caseId!, body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["legal_case_issues", tenantId, caseId] });
      await qc.invalidateQueries({ queryKey: ["legal_case", tenantId, caseId] });
    },
  });
  const update = useMutation({
    mutationFn: async (args: { issueId: string; body: Record<string, unknown> }) =>
      patchIssue(tenantId!, caseId!, args.issueId, args.body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["legal_case_issues", tenantId, caseId] });
    },
  });
  return { ...q, createIssue: create.mutateAsync, updateIssue: update.mutateAsync, mutating: create.isPending || update.isPending };
}

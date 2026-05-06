"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchSnapshots, postSnapshot } from "@/lib/legal/cases/legal-cases-api";
import type { CaseSnapshot } from "@/lib/legal/cases/case-types";

export function useCaseSnapshots(tenantId: string | undefined, caseId: string | undefined) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["legal_case_snapshots", tenantId ?? "", caseId ?? ""],
    enabled: Boolean(tenantId?.trim() && caseId?.trim()),
    queryFn: async () => {
      const { snapshots } = await fetchSnapshots(tenantId!, caseId!);
      return { snapshots: snapshots as CaseSnapshot[] };
    },
  });
  const create = useMutation({
    mutationFn: async (body: Record<string, unknown>) => postSnapshot(tenantId!, caseId!, body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["legal_case_snapshots", tenantId, caseId] });
    },
  });
  return { ...q, createSnapshot: create.mutateAsync, creating: create.isPending };
}

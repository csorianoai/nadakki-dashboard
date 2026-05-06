"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchStrategies, postStrategiesSelect } from "@/lib/legal/cases/legal-cases-api";
import type { CaseStrategy } from "@/lib/legal/cases/case-types";

export function useCaseStrategies(tenantId: string | undefined, caseId: string | undefined) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["legal_case_strategies", tenantId ?? "", caseId ?? ""],
    enabled: Boolean(tenantId?.trim() && caseId?.trim()),
    queryFn: async () => {
      const raw = await fetchStrategies(tenantId!, caseId!);
      if (raw && typeof raw === "object") {
        const o = raw as Record<string, unknown>;
        if (Array.isArray(o.strategies)) return { strategies: o.strategies as CaseStrategy[] };
      }
      return { strategies: [] as CaseStrategy[] };
    },
  });
  const select = useMutation({
    mutationFn: async (body: {
      strategy_ids: string[];
      rationale?: string;
      generate_documents_immediately?: boolean;
    }) => postStrategiesSelect(tenantId!, caseId!, body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["legal_case_strategies", tenantId, caseId] });
      await qc.invalidateQueries({ queryKey: ["legal_case", tenantId, caseId] });
    },
  });
  return { ...q, selectStrategies: select.mutateAsync, selecting: select.isPending };
}

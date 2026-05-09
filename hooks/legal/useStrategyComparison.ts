"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchStrategyComparison,
  type StrategyComparisonResponse,
} from "@/lib/legal/cases/legal-cases-api";

export function useStrategyComparison(
  tenantId: string | undefined,
  caseIds: string[],
) {
  const validIds = (caseIds ?? []).filter((id) => id.trim());

  const q = useQuery<StrategyComparisonResponse>({
    queryKey: ["legal_strategy_comparison", tenantId ?? "", ...validIds],
    enabled: Boolean(tenantId?.trim()) && validIds.length >= 2,
    queryFn: async () => {
      const raw = await fetchStrategyComparison(tenantId!, validIds);
      return raw;
    },
  });

  return {
    ...q,
    comparisons: q.data?.comparisons ?? [],
    caseCount: q.data?.case_count ?? 0,
    strategyTypes: q.data?.strategy_types_across_cases ?? [],
  };
}

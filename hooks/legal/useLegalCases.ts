"use client";

import { useQuery } from "@tanstack/react-query";
import type { CasePriority, CaseState } from "@/lib/legal/cases/case-types";
import { fetchCasesList } from "@/lib/legal/cases/legal-cases-api";

export interface ListFilters {
  state?: CaseState;
  priority?: CasePriority;
  case_type?: string;
  page?: number;
  size?: number;
  q?: string;
}

export function useLegalCases(tenantId: string | undefined, filters: ListFilters = {}) {
  return useQuery({
    queryKey: ["legal_cases", tenantId ?? "", filters],
    enabled: Boolean(tenantId?.trim()),
    queryFn: async () =>
      fetchCasesList(tenantId!, { ...(filters as Record<string, string | number | undefined>) }),
  });
}

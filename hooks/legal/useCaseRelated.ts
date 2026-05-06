"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchRelated } from "@/lib/legal/cases/legal-cases-api";

export function useCaseRelated(tenantId: string | undefined, caseId: string | undefined) {
  return useQuery({
    queryKey: ["legal_case_related", tenantId ?? "", caseId ?? ""],
    enabled: Boolean(tenantId?.trim() && caseId?.trim()),
    queryFn: async () => fetchRelated(tenantId!, caseId!),
  });
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCaseDetail } from "@/lib/legal/cases/legal-cases-api";

export function useLegalCase(tenantId: string | undefined, caseId: string | undefined) {
  return useQuery({
    queryKey: ["legal_case", tenantId ?? "", caseId ?? ""],
    enabled: Boolean(tenantId?.trim() && caseId?.trim()),
    queryFn: async () => fetchCaseDetail(tenantId!, caseId!),
  });
}

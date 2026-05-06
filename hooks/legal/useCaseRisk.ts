"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchRisk } from "@/lib/legal/cases/legal-cases-api";

export function useCaseRisk(tenantId: string | undefined, caseId: string | undefined) {
  return useQuery({
    queryKey: ["legal_case_risk", tenantId ?? "", caseId ?? ""],
    enabled: Boolean(tenantId?.trim() && caseId?.trim()),
    queryFn: async () => fetchRisk(tenantId!, caseId!),
  });
}

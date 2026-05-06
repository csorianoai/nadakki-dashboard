"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchTimeline } from "@/lib/legal/cases/legal-cases-api";

export function useCaseTimeline(tenantId: string | undefined, caseId: string | undefined) {
  return useQuery({
    queryKey: ["legal_case_timeline", tenantId ?? "", caseId ?? ""],
    enabled: Boolean(tenantId?.trim() && caseId?.trim()),
    queryFn: async () => fetchTimeline(tenantId!, caseId!),
  });
}

import { useQuery } from "@tanstack/react-query";
import { governanceApi } from "@/lib/api/governance";
import type { GovernanceReport } from "@/types/governance";

export function useGovernanceReport(auditId?: string | null) {
  return useQuery<GovernanceReport | null>({
    queryKey: ["governance", "report", auditId ?? "latest"],
    queryFn: () => {
      if (auditId) {
        return governanceApi.getReportById(auditId);
      }
      return governanceApi.getLatestReport();
    },
    staleTime: 30_000,
  });
}

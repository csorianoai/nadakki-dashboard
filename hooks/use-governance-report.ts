import { useQuery } from "@tanstack/react-query";
import { governanceApi } from "@/lib/api/governance";
import type { GovernanceReport } from "@/types/governance";

export function useGovernanceReport(auditId?: string | null) {
  return useQuery<GovernanceReport | null>({
    queryKey: ["governance", "report", auditId ?? "latest"],
    queryFn: async ({ signal }) => {
      if (auditId) {
        return governanceApi.getReportById(auditId, signal);
      }
      return governanceApi.getLatestReport(signal);
    },
    staleTime: 30_000,
    retry: false,
    refetchOnReconnect: false,
  });
}

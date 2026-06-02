import { useQuery } from "@tanstack/react-query";
import { governanceApi } from "@/lib/api/governance";

export function useGovernanceStatus(pollingIntervalMs?: number) {
  return useQuery({
    queryKey: ["governance", "status"],
    queryFn: () => governanceApi.getStatus(),
    refetchInterval: pollingIntervalMs ?? false,
    staleTime: 30_000,
  });
}

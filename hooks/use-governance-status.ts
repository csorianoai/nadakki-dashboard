import { useQuery } from "@tanstack/react-query";
import { governanceApi } from "@/lib/api/governance";

export function useGovernanceStatus(pollingIntervalMs?: number) {
  return useQuery({
    queryKey: ["governance", "status"],
    queryFn: ({ signal }) => governanceApi.getStatus(signal),
    refetchInterval: pollingIntervalMs ?? false,
    staleTime: 30_000,
    retry: false,
    refetchOnReconnect: false,
  });
}

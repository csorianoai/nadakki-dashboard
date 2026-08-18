import { useQuery } from "@tanstack/react-query";
import { useTenant } from "./useTenant";
import { getMessageUnreadSummary } from "@/lib/credit-hub/api/operationalClient";

/**
 * Hook to get the total unread message count across all dealer applications.
 * Uses the aggregated unread-summary endpoint to avoid N+1 queries.
 * Single O(1) request instead of O(N) per-application requests.
 */
export function useDealerTotalUnreadMessages(): {
  totalUnread: number;
  isLoading: boolean;
  applicationCounts: Array<{ applicationId: string; unread: number }>;
} {
  const { apiTenantId } = useTenant();

  const summaryQuery = useQuery({
    queryKey: ["messages-unread-summary", apiTenantId, "dealer"],
    queryFn: () =>
      getMessageUnreadSummary({
        tenantId: apiTenantId!,
        actorRole: "dealer",
      }),
    enabled: !!apiTenantId,
    retry: false,
    staleTime: 30_000, // Cache for 30s
    refetchInterval: 30_000, // Auto-refresh every 30s
  });

  const summary = summaryQuery.data;

  return {
    totalUnread: summary?.total_unread ?? 0,
    isLoading: summaryQuery.isLoading,
    applicationCounts:
      summary?.by_application.map((item) => ({
        applicationId: item.application_id,
        unread: item.unread_count,
      })) ?? [],
  };
}

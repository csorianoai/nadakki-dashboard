import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTenant } from "./useTenant";
import { getMessageUnreadSummary } from "@/lib/credit-hub/api/operationalClient";

/**
 * Hook to get the total unread message count across all dealer applications.
 * Uses the aggregated unread-summary endpoint to avoid N+1 queries.
 * Single O(1) request instead of O(N) per-application requests.
 * 
 * Polling pauses when tab is hidden to conserve resources on background tabs.
 */
export function useDealerTotalUnreadMessages(): {
  totalUnread: number;
  isLoading: boolean;
  applicationCounts: Array<{ applicationId: string; unread: number }>;
} {
  const { apiTenantId } = useTenant();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const summaryQuery = useQuery({
    queryKey: ["messages-unread-summary", apiTenantId, "dealer"],
    queryFn: () =>
      getMessageUnreadSummary({
        tenantId: apiTenantId!,
        actorRole: "dealer",
      }),
    enabled: !!apiTenantId && isVisible,
    retry: false,
    staleTime: 120_000, // Cache for 2min
    refetchInterval: isVisible ? 120_000 : false, // Poll every 2min when visible, pause when hidden
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

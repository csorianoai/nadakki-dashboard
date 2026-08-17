import { useQueries } from "@tanstack/react-query";
import { useCreditApplications } from "./useCreditApplications";
import { useTenant } from "./useTenant";
import { getMessageUnreadCount } from "@/lib/credit-hub/api/operationalClient";

/**
 * Hook to get the total unread message count across all dealer applications.
 * Aggregates unread counts from all applications for display in the notification bell.
 */
export function useDealerTotalUnreadMessages(): {
  totalUnread: number;
  isLoading: boolean;
  applicationCounts: Array<{ applicationId: string; unread: number }>;
} {
  const { apiTenantId } = useTenant();
  const applicationsQuery = useCreditApplications();
  const applications = applicationsQuery.data ?? [];

  // Query unread count for each application in parallel
  const unreadQueries = useQueries({
    queries: applications.map((app) => ({
      queryKey: ["app-messages-unread", apiTenantId, app.application_id, "dealer"],
      queryFn: () =>
        getMessageUnreadCount({
          tenantId: apiTenantId!,
          applicationId: app.application_id,
          actorRole: "dealer",
        }),
      enabled: !!apiTenantId && !!app.application_id,
      retry: false,
      staleTime: 30_000, // Cache for 30s to avoid excessive requests
    })),
  });

  const isLoading = applicationsQuery.isLoading || unreadQueries.some((q) => q.isLoading);

  const applicationCounts = applications.map((app, index) => ({
    applicationId: app.application_id,
    unread: unreadQueries[index]?.data ?? 0,
  }));

  const totalUnread = applicationCounts.reduce((sum, item) => sum + item.unread, 0);

  return {
    totalUnread,
    isLoading,
    applicationCounts,
  };
}

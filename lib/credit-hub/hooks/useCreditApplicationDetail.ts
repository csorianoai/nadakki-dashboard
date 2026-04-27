"use client";

import { useQuery } from "@tanstack/react-query";
import { getApplication, getApplicationEvents } from "../api/creditCoreClient";
import { chKeys } from "./queryKeys";
import { useTenant } from "./useTenant";

export function useCreditApplicationDetail(applicationId: string | null | undefined) {
  const { tenantId } = useTenant();

  const applicationQuery = useQuery({
    queryKey: chKeys.creditCoreApplication(tenantId ?? "", applicationId ?? ""),
    queryFn: () => getApplication({ tenantId: tenantId!, applicationId: applicationId! }),
    enabled: !!tenantId && !!applicationId,
    retry: 1,
    staleTime: 30_000,
  });

  const eventsQuery = useQuery({
    queryKey: chKeys.creditCoreEvents(tenantId ?? "", applicationId ?? ""),
    queryFn: () => getApplicationEvents({ tenantId: tenantId!, applicationId: applicationId! }),
    enabled: !!tenantId && !!applicationId,
    retry: 1,
    staleTime: 15_000,
  });

  return {
    application: applicationQuery.data,
    events: eventsQuery.data ?? [],
    isLoading: applicationQuery.isLoading || eventsQuery.isLoading,
    isFetching: applicationQuery.isFetching || eventsQuery.isFetching,
    error: applicationQuery.error ?? eventsQuery.error,
    applicationQuery,
    eventsQuery,
    refetch: async () => {
      await Promise.all([applicationQuery.refetch(), eventsQuery.refetch()]);
    },
  };
}

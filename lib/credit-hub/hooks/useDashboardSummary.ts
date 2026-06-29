"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboardSummary } from "../api/analyticsClient";
import { chKeys } from "./queryKeys";
import { useTenant } from "./useTenant";

export function useDashboardSummary() {
  const { tenantId } = useTenant();
  return useQuery({
    queryKey: chKeys.dashboardSummary(tenantId ?? ""),
    queryFn: () => getDashboardSummary({ tenantId: tenantId! }),
    enabled: !!tenantId,
    retry: 1,
    staleTime: 30_000,
  });
}

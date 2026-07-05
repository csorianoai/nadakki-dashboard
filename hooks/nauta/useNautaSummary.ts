"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboardSummary } from "@/lib/nauta/nautaClient";
import { nautaKeys } from "@/lib/nauta/queryKeys";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";
import type { NautaDashboardSummary } from "@/lib/nauta/types";

const FALLBACK_SUMMARY: NautaDashboardSummary = {
  total_runs: 48217,
  success_rate: 99.2,
  cost_usd_month: 3667,
  hours_saved: 3940,
  pending_approvals: 7,
};

export function useNautaSummary() {
  const { tenantId } = useTenant();
  return useQuery({
    queryKey: nautaKeys.summary(tenantId ?? ""),
    queryFn: () => getDashboardSummary({ tenantId: tenantId! }),
    enabled: !!tenantId,
    retry: 0,
    staleTime: 30_000,
    placeholderData: FALLBACK_SUMMARY,
  });
}

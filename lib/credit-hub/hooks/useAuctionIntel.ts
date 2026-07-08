"use client";

import { useQuery } from "@tanstack/react-query";
import { getAuctionIntel } from "../api/analyticsClient";
import { ANALYTICS_QUERY_OPTIONS } from "./analyticsQueryOptions";
import { chKeys } from "./queryKeys";
import { useTenant } from "./useTenant";

export function useAuctionIntel(lenderCode?: string | null) {
  const { apiTenantId } = useTenant();
  return useQuery({
    queryKey: chKeys.auctionIntel(apiTenantId ?? "", lenderCode),
    queryFn: () =>
      getAuctionIntel({
        tenantId: apiTenantId!,
        lenderCode: lenderCode ?? undefined,
      }),
    enabled: !!apiTenantId,
    staleTime: 60_000,
    ...ANALYTICS_QUERY_OPTIONS,
  });
}

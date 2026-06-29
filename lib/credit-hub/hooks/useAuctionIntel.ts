"use client";

import { useQuery } from "@tanstack/react-query";
import { getAuctionIntel } from "../api/analyticsClient";
import { ANALYTICS_QUERY_OPTIONS } from "./analyticsQueryOptions";
import { chKeys } from "./queryKeys";
import { useTenant } from "./useTenant";

export function useAuctionIntel(lenderCode?: string | null) {
  const { tenantId } = useTenant();
  return useQuery({
    queryKey: chKeys.auctionIntel(tenantId ?? "", lenderCode),
    queryFn: () =>
      getAuctionIntel({
        tenantId: tenantId!,
        lenderCode: lenderCode ?? undefined,
      }),
    enabled: !!tenantId,
    staleTime: 60_000,
    ...ANALYTICS_QUERY_OPTIONS,
  });
}

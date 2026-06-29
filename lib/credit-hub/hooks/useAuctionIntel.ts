"use client";

import { useQuery } from "@tanstack/react-query";
import { getAuctionIntel } from "../api/analyticsClient";
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
    retry: 1,
    staleTime: 60_000,
  });
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { getAnalytics, getDealersRanking, getPortfolioHealth } from "../api/bankClient";
import { chKeys } from "./queryKeys";
import { useTenant } from "./useTenant";

export function useBankAnalytics(period = "30d") {
  const { tenantId } = useTenant();
  return useQuery({
    queryKey: chKeys.bankAnalytics(tenantId ?? "", period),
    queryFn: () => getAnalytics({ tenantId: tenantId!, period }),
    enabled: !!tenantId,
    staleTime: 30_000,
  });
}

export function useBankDealersRanking() {
  const { tenantId } = useTenant();
  return useQuery({
    queryKey: ["credit-hub", "bank", "dealers-ranking", tenantId ?? ""],
    queryFn: () => getDealersRanking({ tenantId: tenantId! }),
    enabled: !!tenantId,
    staleTime: 30_000,
  });
}

export function useBankPortfolioHealth() {
  const { tenantId } = useTenant();
  return useQuery({
    queryKey: ["credit-hub", "bank", "portfolio-health", tenantId ?? ""],
    queryFn: () => getPortfolioHealth({ tenantId: tenantId! }),
    enabled: !!tenantId,
    staleTime: 30_000,
  });
}

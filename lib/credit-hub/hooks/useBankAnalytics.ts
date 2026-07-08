"use client";

import { useQuery } from "@tanstack/react-query";
import { getAnalytics, getDealersRanking, getPortfolioHealth } from "../api/bankClient";
import { chKeys } from "./queryKeys";
import { useTenant } from "./useTenant";

export function useBankAnalytics(period = "30d") {
  const { apiTenantId } = useTenant();
  return useQuery({
    queryKey: chKeys.bankAnalytics(apiTenantId ?? "", period),
    queryFn: () => getAnalytics({ tenantId: apiTenantId!, period }),
    enabled: !!apiTenantId,
    staleTime: 30_000,
  });
}

export function useBankDealersRanking() {
  const { apiTenantId } = useTenant();
  return useQuery({
    queryKey: ["credit-hub", "bank", "dealers-ranking", apiTenantId ?? ""],
    queryFn: () => getDealersRanking({ tenantId: apiTenantId! }),
    enabled: !!apiTenantId,
    staleTime: 30_000,
  });
}

export function useBankPortfolioHealth() {
  const { apiTenantId } = useTenant();
  return useQuery({
    queryKey: ["credit-hub", "bank", "portfolio-health", apiTenantId ?? ""],
    queryFn: () => getPortfolioHealth({ tenantId: apiTenantId! }),
    enabled: !!apiTenantId,
    staleTime: 30_000,
  });
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getBankApplicationDetail, getAuditTrail, getComplianceReport, getCounterOffer, recordDecision } from "../api/bankClient";
import type { BankDecisionRequest } from "../types/bankDecision";
import { chKeys } from "./queryKeys";
import { useTenant } from "./useTenant";

export function useBankApplication(applicationId: string | null | undefined) {
  const { tenantId } = useTenant();
  return useQuery({
    queryKey: chKeys.bankApplication(tenantId ?? "", applicationId ?? ""),
    queryFn: () => getBankApplicationDetail({ tenantId: tenantId!, applicationId: applicationId! }),
    enabled: !!tenantId && !!applicationId,
    staleTime: 15_000,
  });
}

export function useBankDecision(applicationId: string | null | undefined) {
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: BankDecisionRequest) => recordDecision({ tenantId: tenantId!, applicationId: applicationId!, body }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: chKeys.bankQueue(tenantId ?? "") }),
        queryClient.invalidateQueries({ queryKey: chKeys.bankApplication(tenantId ?? "", applicationId ?? "") }),
        queryClient.invalidateQueries({ queryKey: chKeys.bankAuditTrail(tenantId ?? "", applicationId ?? "") }),
        queryClient.invalidateQueries({ queryKey: chKeys.bankAnalytics(tenantId ?? "") }),
      ]);
    },
  });
}

export function useBankCounterOffer(applicationId: string | null | undefined) {
  const { tenantId } = useTenant();
  return useQuery({
    queryKey: ["credit-hub", "bank", "counter-offer", tenantId ?? "", applicationId ?? ""],
    queryFn: () => getCounterOffer({ tenantId: tenantId!, applicationId: applicationId! }),
    enabled: !!tenantId && !!applicationId,
    staleTime: 60_000,
  });
}

export function useBankAuditTrail(applicationId: string | null | undefined) {
  const { tenantId } = useTenant();
  const queryResult = useQuery({
    queryKey: chKeys.bankAuditTrail(tenantId ?? "", applicationId ?? ""),
    queryFn: () => getAuditTrail({ tenantId: tenantId!, applicationId: applicationId! }),
    enabled: !!tenantId && !!applicationId,
    staleTime: 15_000,
  });
  
  console.log("[useBankAuditTrail] QUERY RESULT", {
    applicationId,
    tenantId,
    enabled: !!tenantId && !!applicationId,
    data: queryResult.data,
    error: queryResult.error,
    isLoading: queryResult.isLoading,
    hasData: Boolean(queryResult.data),
    hasEvents: Array.isArray(queryResult.data?.events),
    eventsCount: queryResult.data?.events?.length ?? 0,
  });
  
  return queryResult;
}

export function useBankCompliance(applicationId: string | null | undefined) {
  const { tenantId } = useTenant();
  return useQuery({
    queryKey: chKeys.bankCompliance(tenantId ?? "", applicationId ?? ""),
    queryFn: () => getComplianceReport({ tenantId: tenantId!, applicationId: applicationId! }),
    enabled: !!tenantId && !!applicationId,
    staleTime: 30_000,
  });
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { analyzeApplication, getApplicationAnalysis } from "../api/creditAnalysisClient";
import { chKeys } from "./queryKeys";
import { useTenant } from "./useTenant";

export function useCreditAnalysis(applicationId: string | null | undefined) {
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();
  const queryKey = chKeys.creditAnalysis(tenantId ?? "", applicationId ?? "");

  const analysisQuery = useQuery({
    queryKey,
    queryFn: () => getApplicationAnalysis({ tenantId: tenantId!, applicationId: applicationId! }),
    enabled: !!tenantId && !!applicationId,
    retry: 1,
    staleTime: 30_000,
  });

  const analyzeMutation = useMutation({
    mutationFn: () => analyzeApplication({ tenantId: tenantId!, applicationId: applicationId! }),
    onSuccess: async (data) => {
      queryClient.setQueryData(queryKey, data);
      await queryClient.invalidateQueries({ queryKey });
      await queryClient.invalidateQueries({
        queryKey: chKeys.creditCoreApplication(tenantId ?? "", applicationId ?? ""),
      });
      await queryClient.invalidateQueries({
        queryKey: chKeys.creditCoreEvents(tenantId ?? "", applicationId ?? ""),
      });
    },
  });

  return {
    data: analyzeMutation.data ?? analysisQuery.data,
    isLoading: analysisQuery.isLoading,
    isAnalyzing: analyzeMutation.isPending,
    error: analyzeMutation.error ?? analysisQuery.error,
    mutate: analyzeMutation.mutate,
    mutateAsync: analyzeMutation.mutateAsync,
    refetch: analysisQuery.refetch,
  };
}

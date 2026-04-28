"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bulkDecide } from "../api/bankClient";
import type { BankBulkRule } from "../types/bankDecision";
import { chKeys } from "./queryKeys";
import { useTenant } from "./useTenant";

export function useBulkActions() {
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { applicationIds: string[]; rule: BankBulkRule; analystId: string; justification: string }) =>
      bulkDecide({ tenantId: tenantId!, ...params }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: chKeys.bankQueue(tenantId ?? "") }),
        queryClient.invalidateQueries({ queryKey: chKeys.bankAnalytics(tenantId ?? "") }),
      ]);
    },
  });
}

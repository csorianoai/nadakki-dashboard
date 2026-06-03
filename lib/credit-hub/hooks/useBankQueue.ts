"use client";

import { useQuery } from "@tanstack/react-query";
import { getQueue, type BankQueueRequestParams } from "../api/bankClient";
import { chKeys } from "./queryKeys";
import { useTenant } from "./useTenant";

export type UseBankQueueOptions = Pick<BankQueueRequestParams, "limit" | "offset" | "filters">;

export function useBankQueue(options?: UseBankQueueOptions) {
  const { tenantId } = useTenant();
  const queryOpts = options
    ? { limit: options.limit, offset: options.offset, filters: options.filters }
    : undefined;
  return useQuery({
    queryKey: chKeys.bankQueue(tenantId ?? "", queryOpts),
    queryFn: () =>
      getQueue({
        tenantId: tenantId!,
        limit: options?.limit,
        offset: options?.offset,
        filters: options?.filters,
      }),
    enabled: !!tenantId,
    staleTime: 15_000,
  });
}

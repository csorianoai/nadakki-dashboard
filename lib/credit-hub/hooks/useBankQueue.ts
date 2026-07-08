"use client";

import { useQuery } from "@tanstack/react-query";
import { getQueue, type BankQueueRequestParams } from "../api/bankClient";
import { chKeys } from "./queryKeys";
import { useTenant } from "./useTenant";

export type UseBankQueueOptions = Pick<BankQueueRequestParams, "limit" | "offset" | "filters">;

export function useBankQueue(options?: UseBankQueueOptions) {
  const { apiTenantId } = useTenant();
  const queryOpts = options
    ? { limit: options.limit, offset: options.offset, filters: options.filters }
    : undefined;
  return useQuery({
    queryKey: chKeys.bankQueue(apiTenantId ?? "", queryOpts),
    queryFn: () =>
      getQueue({
        tenantId: apiTenantId!,
        limit: options?.limit,
        offset: options?.offset,
        filters: options?.filters,
      }),
    enabled: !!apiTenantId,
    staleTime: 15_000,
  });
}

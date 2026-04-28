"use client";

import { useQuery } from "@tanstack/react-query";
import { getQueue } from "../api/bankClient";
import { chKeys } from "./queryKeys";
import { useTenant } from "./useTenant";

export function useBankQueue() {
  const { tenantId } = useTenant();
  return useQuery({
    queryKey: chKeys.bankQueue(tenantId ?? ""),
    queryFn: () => getQueue({ tenantId: tenantId! }),
    enabled: !!tenantId,
    staleTime: 15_000,
  });
}

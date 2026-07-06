"use client";

import { useQuery } from "@tanstack/react-query";
import { getHealth } from "@/lib/nauta/nautaClient";
import { nautaKeys } from "@/lib/nauta/queryKeys";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";

export function useNautaHealth() {
  const { tenantId } = useTenant();
  return useQuery({
    queryKey: nautaKeys.health(tenantId ?? ""),
    queryFn: () => getHealth(),
    enabled: !!tenantId,
    retry: 1,
    staleTime: 60_000,
  });
}

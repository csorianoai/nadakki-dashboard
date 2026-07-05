"use client";

import { useQuery } from "@tanstack/react-query";
import { getEmployees } from "@/lib/nauta/nautaClient";
import { nautaKeys } from "@/lib/nauta/queryKeys";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";

export function useNautaEmployees() {
  const { tenantId } = useTenant();
  return useQuery({
    queryKey: nautaKeys.employees(tenantId ?? ""),
    queryFn: () => getEmployees({ tenantId: tenantId! }),
    enabled: !!tenantId,
    retry: 1,
    staleTime: 30_000,
  });
}

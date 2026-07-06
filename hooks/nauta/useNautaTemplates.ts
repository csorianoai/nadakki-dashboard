"use client";

import { useQuery } from "@tanstack/react-query";
import { getTemplates } from "@/lib/nauta/nautaClient";
import { nautaKeys } from "@/lib/nauta/queryKeys";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";

export function useNautaTemplates() {
  const { tenantId } = useTenant();
  return useQuery({
    queryKey: nautaKeys.templates(tenantId ?? ""),
    queryFn: () => getTemplates(),
    enabled: !!tenantId,
    retry: 1,
    staleTime: 60_000,
  });
}

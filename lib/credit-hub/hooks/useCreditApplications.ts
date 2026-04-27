"use client";

import { useQuery } from "@tanstack/react-query";
import { listApplications } from "../api/creditCoreClient";
import { chKeys } from "./queryKeys";
import { useTenant } from "./useTenant";

export function useCreditApplications() {
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: chKeys.creditCoreApplications(tenantId ?? ""),
    queryFn: () => listApplications({ tenantId: tenantId! }),
    enabled: !!tenantId,
    retry: 1,
    staleTime: 30_000,
  });
}

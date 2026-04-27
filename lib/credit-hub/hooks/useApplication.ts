"use client";

import { useQuery } from "@tanstack/react-query";
import { getApplication } from "../api/applications";
import { useActorRole } from "./useActorRole";
import { chKeys } from "./queryKeys";
import { useTenant } from "./useTenant";

export function useApplication(applicationId: string | null | undefined) {
  const { tenantId } = useTenant();
  const { actorRole } = useActorRole();

  return useQuery({
    queryKey: chKeys.application(tenantId ?? "", applicationId ?? ""),
    queryFn: () =>
      getApplication({
        tenantId: tenantId!,
        actorRole: actorRole ?? "dealer",
        applicationId: applicationId!,
      }),
    enabled: !!tenantId && !!applicationId,
    staleTime: 30_000,
  });
}

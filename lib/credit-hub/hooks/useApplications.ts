"use client";

import { useQuery } from "@tanstack/react-query";
import { listApplications } from "../api/applications";
import { useActorRole } from "./useActorRole";
import { chKeys } from "./queryKeys";
import { useTenant } from "./useTenant";

export function useApplications() {
  const { tenantId } = useTenant();
  const { actorRole } = useActorRole();

  return useQuery({
    queryKey: chKeys.applications(tenantId ?? ""),
    queryFn: () =>
      listApplications({
        tenantId: tenantId!,
        actorRole: actorRole ?? "dealer",
      }),
    enabled: !!tenantId,
    staleTime: 30_000,
  });
}

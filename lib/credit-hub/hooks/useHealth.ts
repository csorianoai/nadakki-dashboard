"use client";

import { useQuery } from "@tanstack/react-query";
import { getHealth } from "../api/health";
import { useActorRole } from "./useActorRole";
import { chKeys } from "./queryKeys";
import { useTenant } from "./useTenant";

export function useHealth() {
  const { tenantId } = useTenant();
  const { actorRole } = useActorRole();

  return useQuery({
    queryKey: chKeys.health(),
    queryFn: () =>
      getHealth({
        tenantId: tenantId!,
        actorRole: actorRole ?? "dealer",
      }),
    enabled: !!tenantId,
    staleTime: 30_000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";
import { getHealth, getProyecto, listProyectos } from "@/lib/projects/projectsClient";
import { projectsKeys } from "./queryKeys";

export function useProyectos() {
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: projectsKeys.proyectos(tenantId ?? ""),
    queryFn: () => listProyectos({ tenantId: tenantId! }),
    enabled: Boolean(tenantId),
    staleTime: 30_000,
  });
}

export function useProyecto(proyectoId: string | undefined) {
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: projectsKeys.proyecto(tenantId ?? "", proyectoId ?? ""),
    queryFn: () => getProyecto({ tenantId: tenantId!, id: proyectoId! }),
    enabled: Boolean(tenantId && proyectoId),
    staleTime: 30_000,
  });
}

export function useProyectoHealth() {
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: projectsKeys.health(tenantId ?? ""),
    queryFn: () => getHealth({ tenantId: tenantId! }),
    enabled: Boolean(tenantId),
    staleTime: 60_000,
    retry: 0,
  });
}

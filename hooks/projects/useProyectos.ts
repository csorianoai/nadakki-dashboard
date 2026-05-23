"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";
import {
  createProyecto,
  getAuditTrail,
  getHealth,
  getProyecto,
  listProyectos,
} from "@/lib/projects/projectsClient";
import type { CreateProyectoPayload } from "@/lib/projects/types";
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

export function useProyectoAuditTrail(proyectoId: string | undefined) {
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: projectsKeys.auditTrail(tenantId ?? "", proyectoId ?? ""),
    queryFn: () => getAuditTrail({ tenantId: tenantId!, proyectoId: proyectoId! }),
    enabled: Boolean(tenantId && proyectoId),
    staleTime: 30_000,
    retry: 0,
  });
}

export function useCreateProyecto() {
  const qc = useQueryClient();
  const { tenantId } = useTenant();

  return useMutation({
    mutationFn: async (payload: CreateProyectoPayload) => {
      if (!tenantId) throw new Error("Sin tenant activo.");
      return createProyecto({ tenantId, payload });
    },
    onSuccess: () => {
      if (tenantId) void qc.invalidateQueries({ queryKey: projectsKeys.proyectos(tenantId) });
    },
  });
}

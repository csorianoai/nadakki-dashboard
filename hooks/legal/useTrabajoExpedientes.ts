"use client";

import { useMemo } from "react";
import type { LegalCase } from "@/lib/legal/cases/case-types";
import { filasDeTrabajo, type FilaTrabajo } from "@/lib/legal/home/trabajo-expedientes";
import { useUpcomingDeadlines } from "@/hooks/legal/useUpcomingDeadlines";
import { useValidationQueue } from "@/hooks/legal/useValidationQueue";

/** Horizonte de plazos para la columna «Próximo plazo» (los vencidos sin acusar vienen siempre). */
export const HORIZONTE_PLAZOS_DIAS = 30;

export type TrabajoExpedientes = {
  filas: FilaTrabajo[];
  /** La columna de revisiones no aplica al usuario (sin rol de abogado) o no cargó. */
  revisionesDisponibles: boolean;
  plazosDisponibles: boolean;
};

/** Une, en el cliente, lo que ya dan tres APIs reales: expedientes, plazos próximos y cola de revisión. */
export function useTrabajoExpedientes(
  tenantId: string | undefined,
  casos: LegalCase[],
  opciones: { incluirCerrados?: boolean } = {},
): TrabajoExpedientes {
  const plazos = useUpcomingDeadlines(tenantId, HORIZONTE_PLAZOS_DIAS, false, true);
  const cola = useValidationQueue(tenantId);
  const plazosOk = Boolean(plazos.data) && !plazos.error;
  const colaOk = !cola.loading && !cola.forbidden && !cola.error && !cola.partial;
  const incluirCerrados = Boolean(opciones.incluirCerrados);

  const filas = useMemo(
    () => filasDeTrabajo(casos, plazosOk ? plazos.data!.deadlines : null, colaOk ? cola.open : null, { incluirCerrados }),
    [casos, plazosOk, plazos.data, colaOk, cola.open, incluirCerrados],
  );
  return { filas, revisionesDisponibles: colaOk, plazosDisponibles: plazosOk };
}

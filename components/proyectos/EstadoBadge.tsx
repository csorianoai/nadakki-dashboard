"use client";

import { Badge } from "@/components/forge";
import type { BadgeVariant } from "@/components/forge/ui/Badge";
import {
  PROYECTO_STATE_LABELS_ES,
  type ProyectoState,
  isProyectoState,
} from "@/lib/projects/types";

function variantForBackendState(stateRaw: string | null | undefined): BadgeVariant {
  if (!stateRaw) return "neutral";
  const s = stateRaw.toUpperCase();

  if (s.includes("CANCEL") || s.includes("RECHAZ")) return "danger";

  const known: Partial<Record<ProyectoState, BadgeVariant>> = {
    INTAKE: "neutral",
    SCOPING: "neutral",
    PLANNING: "info",
    ACTIVE: "info",
    ON_HOLD: "warning",
    REVIEW: "warning",
    FINANCE_REVIEW: "warning",
    LEGAL_REVIEW: "warning",
    CERRADO: "success",
  };

  if (isProyectoState(s)) return known[s] ?? "neutral";
  return "neutral";
}

function labelForState(stateRaw: string | null | undefined): string {
  if (!stateRaw) return "Sin estado";
  const s = stateRaw.toUpperCase();
  if (isProyectoState(s)) return PROYECTO_STATE_LABELS_ES[s];
  return stateRaw;
}

export interface EstadoBadgeProps {
  state: string | null | undefined;
  className?: string;
}

/**
 * Estado del portafolio (9 estados conocidos + cancelación vía texto legacy).
 */
export function EstadoBadge({ state, className }: EstadoBadgeProps) {
  return (
    <Badge variant={variantForBackendState(state)} className={className}>
      {labelForState(state)}
    </Badge>
  );
}

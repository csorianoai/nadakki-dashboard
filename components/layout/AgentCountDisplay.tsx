"use client";

import React from "react";
import { useAgents } from "@/app/hooks/useAgents";

type Props = {
  /** Si se pasa, se usa este conteo (no hace fetch adicional) */
  count?: number;
  /** Mostrar etiqueta 'AGENTES' */
  showLabel?: boolean;
  /** Clase extra opcional */
  className?: string;
};

export default function AgentCountDisplay({
  count,
  showLabel = true,
  className = "",
}: Props) {
  // Hook real: { data: Agent[]; isLoading: boolean; }
  const { data, isLoading } = useAgents();

  // Determina conteo sin mentir:
  // - Si hay count explícito, úsalo.
  // - Si no, usa data.length si está disponible.
  const resolvedCount =
    typeof count === "number"
      ? count
      : Array.isArray(data)
      ? data.length
      : null;

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
        <span className="text-sm text-gray-400">Cargando agentes...</span>
      </div>
    );
  }

  return (
    <div className={`flex items-baseline justify-between ${className}`}>
      <div className="text-lg font-bold">
        {resolvedCount ?? "—"}
      </div>
      {showLabel && <div className="text-xs text-gray-500">AGENTES</div>}
    </div>
  );
}

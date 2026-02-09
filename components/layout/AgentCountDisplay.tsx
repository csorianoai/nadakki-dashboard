"use client";

import React from "react";
import { useAgents } from "@/app/hooks/useAgents";

type Props = {
  /** Si se pasa, se usa este conteo (no hace fetch adicional) */
  count?: number;
  /** Mostrar etiqueta 'AGENTES' */
  showLabel?: boolean;
  /** Mostrar source (api/local/empty) */
  showSource?: boolean;
  /** Clase extra opcional */
  className?: string;
};

export default function AgentCountDisplay({
  count,
  showLabel = true,
  showSource = false,
  className = "",
}: Props) {
  // Hook correcto: { agents, loading, error, source, lastError }
  const { agents, loading, error, source } = useAgents();

  // Determina conteo sin mentir:
  // - Si hay count explícito, úsalo.
  // - Si no, usa agents.length si está disponible.
  const resolvedCount =
    typeof count === "number"
      ? count
      : Array.isArray(agents)
      ? agents.length
      : null;

  // Si hay error y no hay data, mostrar estado
  if (loading && resolvedCount === null) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
        <span className="text-sm text-gray-400">Cargando agentes...</span>
      </div>
    );
  }

  // Mostrar conteo con badge de source si es fallback
  const isFallback = source === "local" || source === "empty";
  const sourceBadge = {
    api: "bg-green-100 text-green-700",
    local: "bg-yellow-100 text-yellow-700",
    empty: "bg-red-100 text-red-700",
  }[source] || "bg-gray-100 text-gray-700";

  return (
    <div className={`flex items-baseline justify-between gap-2 ${className}`}>
      <div className="text-lg font-bold">
        {resolvedCount ?? "—"}
      </div>
      {showLabel && <div className="text-xs text-gray-500">AGENTES</div>}
      {showSource && (
        <span className={`text-xs px-2 py-0.5 rounded-full ${sourceBadge}`}>
          {source === "api" ? "🔗 API" : source === "local" ? "💾 Local" : "⚠️ Empty"}
        </span>
      )}
    </div>
  );
}

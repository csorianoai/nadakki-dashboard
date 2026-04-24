"use client";

import React from "react";
import { useAgentRegistrySummary } from "@/app/hooks/useAgentRegistrySummary";

type Props = {
  /** Si se pasa, se usa este conteo estático (sin llamar al registry) */
  count?: number;
  /** Mostrar etiqueta 'AGENTES' */
  showLabel?: boolean;
  /** Reservado; el conteo oficial viene del Agent Registry */
  showSource?: boolean;
  /** Clase extra opcional */
  className?: string;
};

export default function AgentCountDisplay({
  count,
  showLabel = true,
  showSource: _showSource = false,
  className = "",
}: Props) {
  const registry = useAgentRegistrySummary();

  if (typeof count === "number") {
    return (
      <div className={`flex items-baseline justify-between gap-2 ${className}`}>
        <div className="text-lg font-bold">{count}</div>
        {showLabel && <div className="text-xs text-gray-500">AGENTES</div>}
      </div>
    );
  }

  if (registry.loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
        <span className="text-sm text-gray-400">Agent Registry…</span>
      </div>
    );
  }

  if (!registry.available || !registry.summary) {
    return (
      <div className={`flex flex-col gap-0.5 ${className}`} title={registry.tooltip}>
        <div className="text-xs font-medium text-amber-700 dark:text-amber-400/90 leading-tight">
          Agent Registry unavailable
        </div>
        {showLabel && <div className="text-[10px] text-gray-500">REGISTRY</div>}
      </div>
    );
  }

  const s = registry.summary;
  const sub = s.countKind === "executable" ? "executable" : "official";

  return (
    <div className={`flex flex-col gap-0.5 ${className}`} title={registry.tooltip}>
      <div className="text-lg font-bold leading-none">{s.displayCount}</div>
      <div className="text-[10px] text-gray-500 leading-tight">
        {showLabel ? (
          <>
            {sub} · <span className="uppercase">agents</span>
          </>
        ) : (
          sub
        )}
      </div>
    </div>
  );
}

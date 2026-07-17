"use client";

import { HoverTooltip } from "@/components/ui/HoverTooltip";

const CIRC = 100.53;

export function MatchScore({ match }: { match: number }) {
  const dash = (match / 100) * CIRC;

  return (
    <HoverTooltip text="Score compuesto basado en tu perfil crediticio, presupuesto mensual, preferencias de vehículo y historial de búsqueda.">
      <div className="inline-flex cursor-help items-center gap-3 rounded-r border border-nk-border bg-nk-surface px-4 py-3 shadow-nk-sm">
        <div className="relative h-10 w-10 shrink-0">
          <svg viewBox="0 0 40 40" className="h-10 w-10 -rotate-90" aria-hidden>
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="var(--surface-3, #E9EEF6)"
              strokeWidth="4"
            />
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="var(--brand, #1E40AF)"
              strokeWidth="4"
              strokeDasharray={`${dash} ${CIRC}`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-manrope text-[22px] font-extrabold text-brand">
            {match}
          </span>
        </div>
        <div>
          <p className="font-manrope text-lg font-extrabold text-brand">{match}%</p>
          <p className="text-sm text-nk-fg-muted">Match con tu perfil</p>
        </div>
      </div>
    </HoverTooltip>
  );
}

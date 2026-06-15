"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { chScoreBand } from "@/lib/credit-hub/ch-base";
import type { ScoreVisualProps } from "@/lib/credit-hub/ch-types";

export function ScoreVisual({
  score,
  min = 300,
  max = 900,
  size = 120,
  thickness = 10,
  label = true,
}: ScoreVisualProps) {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(min, Math.min(max, score));
  const progress = (clamped - min) / (max - min);
  const offset = circumference * (1 - progress);
  const band = chScoreBand(clamped, min, max);
  const center = size / 2;

  const ariaLabel = useMemo(
    () => `Puntaje crediticio ${clamped} de ${max}. Banda: ${band.label}.`,
    [band.label, clamped, max]
  );

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }} role="img" aria-label={ariaLabel}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden>
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="var(--ch-line)"
            strokeWidth={thickness}
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="var(--ch-persona-primary)"
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="ch-mono text-3xl font-bold" style={{ color: "var(--ch-ink)" }}>
            {clamped}
          </span>
          {label ? (
            <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--ch-ink-3)" }}>
              / {max}
            </span>
          ) : null}
        </div>
      </div>
      <span className={cn("ch-pill", band.cssClass)}>{band.label}</span>
    </div>
  );
}

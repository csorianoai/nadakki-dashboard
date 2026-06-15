"use client";

import { cn } from "@/lib/utils";
import type { EvidenceGridProps } from "@/lib/credit-hub/ch-types";

const confidenceLabel = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
} as const;

export function EvidenceGrid({ items, columns = 2, className }: EvidenceGridProps) {
  const gridClass =
    columns === 1 ? "grid-cols-1" : columns === 3 ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2";

  return (
    <div className={cn("grid gap-3", gridClass, className)}>
      {items.map((item) => (
        <article key={item.id} className="ch-card p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold" style={{ color: "var(--ch-ink)" }}>
              {item.title}
            </h3>
            {item.confidence ? (
              <span className="ch-chip">{confidenceLabel[item.confidence]}</span>
            ) : null}
          </div>
          <p className="mt-2 text-sm" style={{ color: "var(--ch-ink-2)" }}>
            {item.body}
          </p>
          {item.sourceLabel ? (
            <p className="mt-3 text-[10px] uppercase tracking-wide" style={{ color: "var(--ch-ink-4)" }}>
              Fuente: {item.sourceLabel}
            </p>
          ) : null}
        </article>
      ))}
    </div>
  );
}

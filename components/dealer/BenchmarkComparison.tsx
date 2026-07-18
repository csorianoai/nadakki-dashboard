"use client";

import type { BenchmarkItem } from "@/lib/dealer/insights-mock";
import { cn } from "@/lib/utils";

export function BenchmarkComparison({ items }: { items: BenchmarkItem[] }) {
  return (
    <div className="space-y-4">
      {items.map((item) => {
        const max = Math.max(item.yours, item.average, 1);
        return (
          <div key={item.id} className="rounded-r-sm border border-nk-border bg-nk-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-nk-fg">{item.label}</p>
              {item.rank ? (
                <span className="text-xs font-semibold text-brand-2">{item.rank}</span>
              ) : (
                <span
                  className={cn(
                    "text-xs font-bold",
                    item.better ? "text-green-600" : "text-red-500",
                  )}
                >
                  {item.better ? "📈 mejor" : "📉 por debajo"}
                </span>
              )}
            </div>
            <div className="mt-3 space-y-2">
              <Bar label="Tu dealership" value={item.yours} max={max} highlight />
              <Bar label="Promedio mercado" value={item.average} max={max} />
            </div>
            <p className="mt-2 text-xs text-nk-fg-muted">
              {item.yours}
              {item.unit} vs promedio {item.average}
              {item.unit}
            </p>
          </div>
        );
      })}
      <p className="text-xs text-nk-fg-subtle">
        Datos anonimizados de dealers similares en RD
      </p>
    </div>
  );
}

function Bar({
  label,
  value,
  max,
  highlight,
}: {
  label: string;
  value: number;
  max: number;
  highlight?: boolean;
}) {
  const pct = (value / max) * 100;
  return (
    <div>
      <div className="mb-1 flex justify-between text-[10px] text-nk-fg-subtle">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-nk-surface-3">
        <div
          className={cn("h-full rounded-full", highlight ? "bg-brand-2" : "bg-nk-fg-muted/40")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

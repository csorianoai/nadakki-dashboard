"use client";

import type { SourcesSummary } from "../lib/types";

interface MetricsStripProps {
  summary: SourcesSummary;
  totalMarketRd?: number;
}

export function MetricsStrip({ summary, totalMarketRd }: MetricsStripProps) {
  const high = summary.by_confidence?.high ?? 0;
  const medium = summary.by_confidence?.medium ?? 0;
  const low = summary.by_confidence?.low ?? 0;

  const metrics = [
    { label: "Fuentes totales", value: String(summary.total) },
    { label: "Alta confianza", value: String(high) },
    { label: "Media confianza", value: String(medium) },
    { label: "Baja confianza", value: String(low) },
    ...(totalMarketRd
      ? [
          {
            label: "Mercado (RD$)",
            value: new Intl.NumberFormat("es-DO", {
              notation: "compact",
              maximumFractionDigits: 1,
            }).format(totalMarketRd),
          },
        ]
      : []),
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="rounded-forge-md border border-forgeGray-200 bg-forgeSurface-card px-4 py-3 shadow-forge-xs"
        >
          <p className="text-forge-xs font-medium uppercase tracking-wide text-forgeGray-500">
            {m.label}
          </p>
          <p className="mt-1 font-display text-forge-xl font-bold text-forgeGray-800">{m.value}</p>
        </div>
      ))}
    </div>
  );
}

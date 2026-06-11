"use client";

import { useMemo, useState } from "react";
import type { InstitutionShare } from "../lib/types";
import { TIER_COLORS } from "../lib/constants";

type ChartMode = "portfolio" | "participation";

interface InstitutionChartProps {
  shares: InstitutionShare[];
}

export function InstitutionChart({ shares }: InstitutionChartProps) {
  const [mode, setMode] = useState<ChartMode>("portfolio");

  const maxValue = useMemo(() => {
    if (!shares.length) return 1;
    return Math.max(
      ...shares.map((s) => (mode === "portfolio" ? s.portfolio_rd : s.participation_pct))
    );
  }, [shares, mode]);

  const formatValue = (share: InstitutionShare) => {
    if (mode === "portfolio") {
      return new Intl.NumberFormat("es-DO", {
        style: "currency",
        currency: "DOP",
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(share.portfolio_rd);
    }
    return `${share.participation_pct.toFixed(1)}%`;
  };

  return (
    <section
      className="rounded-forge-lg border border-forgeGray-200 bg-forgeSurface-card p-4 shadow-forge-xs"
      aria-labelledby="institution-chart-title"
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 id="institution-chart-title" className="font-display text-forge-md font-semibold text-forgeGray-800">
          Participación por institución
        </h3>
        <div
          className="inline-flex rounded-forge-pill border border-forgeGray-200 bg-forgeSurface-sunken p-0.5"
          role="group"
          aria-label="Modo de visualización"
        >
          <button
            type="button"
            onClick={() => setMode("portfolio")}
            aria-pressed={mode === "portfolio"}
            className={`rounded-forge-pill px-3 py-1 text-forge-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--mee-accent)] ${
              mode === "portfolio"
                ? "bg-[var(--mee-accent)] text-white"
                : "text-forgeGray-600 hover:text-forgeGray-800"
            }`}
          >
            Cartera RD$
          </button>
          <button
            type="button"
            onClick={() => setMode("participation")}
            aria-pressed={mode === "participation"}
            className={`rounded-forge-pill px-3 py-1 text-forge-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--mee-accent)] ${
              mode === "participation"
                ? "bg-[var(--mee-accent)] text-white"
                : "text-forgeGray-600 hover:text-forgeGray-800"
            }`}
          >
            Participación %
          </button>
        </div>
      </div>

      <ul className="space-y-3" aria-label="Gráfico de barras por institución">
        {shares.map((share) => {
          const value = mode === "portfolio" ? share.portfolio_rd : share.participation_pct;
          const widthPct = Math.max(4, (value / maxValue) * 100);
          const color = TIER_COLORS[share.tier] ?? TIER_COLORS.T3;
          return (
            <li key={share.name} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <div className="min-w-0">
                <div className="mb-1 flex items-center justify-between gap-2 text-forge-xs">
                  <span className="truncate font-medium text-forgeGray-700">{share.name}</span>
                  <span className="shrink-0 font-forgeMono text-forgeGray-600">{formatValue(share)}</span>
                </div>
                <div
                  className="h-3 w-full overflow-hidden rounded-forge-pill bg-forgeGray-100"
                  role="img"
                  aria-label={`${share.name}: ${formatValue(share)}, tier ${share.tier}`}
                >
                  <div
                    className="h-full rounded-forge-pill transition-all duration-300"
                    style={{ width: `${widthPct}%`, backgroundColor: color }}
                  />
                </div>
              </div>
              <span
                className="shrink-0 rounded-forge-sm border px-1.5 py-0.5 font-forgeMono text-[10px] font-semibold"
                style={{ borderColor: color, color }}
              >
                {share.tier}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

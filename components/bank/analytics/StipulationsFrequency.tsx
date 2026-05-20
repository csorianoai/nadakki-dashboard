"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { BankAnalytics } from "@/types/bank-analytics";
import { maskBankAnalyticsText } from "@/lib/bank/analytics-api";

export function StipulationsSkeleton() {
  return (
    <div
      className="min-h-[300px] w-full animate-pulse rounded-xl border border-white/10 bg-white/[0.04]"
      aria-hidden
      data-testid="stips-chart-skeleton"
    />
  );
}

interface StipulationsFrequencyProps {
  items: BankAnalytics["stipulationsFrequency"]["topStipulations"];
  loading: boolean;
  onPick?: (name: string) => void;
}

export function StipulationsFrequency({ items, loading, onPick }: StipulationsFrequencyProps) {
  const rows = useMemo(
    () =>
      [...items]
        .slice(0, 10)
        .map((item) => ({
          displayName: maskBankAnalyticsText(item.name),
          count: item.count,
          percent: item.percent,
          rawKey: item.name,
        }))
        .sort((a, b) => b.count - a.count),
    [items],
  );

  if (loading) {
    return <StipulationsSkeleton />;
  }

  if (!rows.length) {
    return (
      <p className="text-sm text-gray-500" data-testid="stips-chart-empty">
        Sin estipulaciones destacadas para este segmento temporal.
      </p>
    );
  }

  return (
    <div
      className="rounded-xl border border-white/10 bg-slate-950/40 p-3 sm:p-4"
      data-testid="stipulations-frequency"
    >
      <h3 className="mb-3 text-lg font-semibold text-white">Top estipulaciones</h3>
      <p className="sr-only">
        Lista agregada; las etiquetas se enmascaran para evitar fugas accidentales de PII textual.
      </p>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          layout="vertical"
          data={rows}
          margin={{ top: 8, left: 4, bottom: 8, right: 16 }}
          accessibilityLayer
          aria-label="Frecuencia agregada de estipulaciones"
        >
          <CartesianGrid strokeDasharray="3 6" horizontal={false} stroke="rgba(148,163,184,0.12)" />
          <XAxis
            type="number"
            dataKey="percent"
            stroke="#cbd5f5"
            domain={[0, "auto"]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            label={{ value: "% del volumen declarado por API", fill: "#a78bfa", fontSize: 11 }}
          />
          <YAxis
            type="category"
            width={148}
            dataKey="displayName"
            stroke="#cbd5f5"
            interval={0}
            tickFormatter={(txt) =>
              txt.length > 22 ? `${String(txt).slice(0, 20)}…` : String(txt)
            }
          />
          <Tooltip
            contentStyle={{
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(7,15,39,0.98)",
              color: "#fafafa",
            }}
            formatter={(value: unknown) =>
              `${typeof value === "number" ? value.toLocaleString("es-DO") : value} registros sintetizados`
            }
            labelFormatter={(_, payload) =>
              `${maskBankAnalyticsText((payload?.[0]?.payload as { rawKey?: string } | undefined)?.rawKey)} • % del portal`
            }
          />
          <Bar
            dataKey="percent"
            radius={[0, 8, 8, 0]}
            fill="#c084fc"
            maxBarSize={22}
            onClick={(datum: unknown) => {
              const evt = datum as { payload?: { rawKey?: string; displayName?: string } };
              const picked = evt?.payload?.rawKey ?? evt?.payload?.displayName;
              if (picked) {
                onPick?.(picked);
              }
            }}
          />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 flex flex-wrap gap-2" aria-label="Filtros rápidos de estipulación">
        {rows.map((row, idx) => (
          <button
            key={row.rawKey}
            type="button"
            data-testid={`stipulation-chip-${idx}`}
            className="min-h-[40px] rounded-full border border-fuchsia-500/40 px-3 py-1 text-left text-xs text-fuchsia-50"
            onClick={() => onPick?.(row.rawKey)}
          >
            Filtrar: {row.displayName}
          </button>
        ))}
      </div>
    </div>
  );
}

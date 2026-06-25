"use client";

import { HEAT_BANDS, HEAT_ALPHA } from "@/lib/legal-cockpit/calendar-data";

const METRICS = [
  { label: "TIEMPO PROM. RESOLUCIÓN", value: "2.4", unit: "días", spark: "0,20 16,18 32,22 48,16 64,14 80,10 100,8", color: "139,92,246" },
  { label: "TASA DE ÉXITO", value: "87", unit: "%", spark: "0,22 16,20 32,18 48,15 64,12 80,10 100,6", color: "16,185,129" },
  { label: "CASOS MES", value: "23", unit: "/30", spark: "0,26 16,22 32,20 48,18 64,14 80,12 100,8", color: "59,130,246" },
];

const DOW = ["L", "M", "X", "J", "V", "S", "D"];

export function PerformanceMetrics() {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
          Métricas de rendimiento
        </p>
        <h2 className="text-lg font-semibold text-zinc-100 mt-0.5">Performance</h2>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {METRICS.map((m) => (
          <div
            key={m.label}
            className="rounded-xl p-4 relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, rgba(${m.color},0.10), rgba(${m.color},0.02))`,
              border: `1px solid rgba(${m.color},0.20)`,
            }}
          >
            <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2">
              {m.label}
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-white">{m.value}</span>
              <span className="text-sm text-zinc-400">{m.unit}</span>
            </div>
            {/* Progress bar */}
            <div className="mt-3 h-1.5 rounded-full bg-zinc-800/60 overflow-hidden">
              <div
                className="h-full rounded-full animate-[growBar_1.2s_ease-out_forwards]"
                style={{
                  width: m.unit === "%" ? `${m.value}%` : m.unit === "/30" ? `${(parseInt(m.value) / 30) * 100}%` : "60%",
                  background: `rgb(${m.color})`,
                }}
              />
            </div>
            {/* Sparkline */}
            <svg
              viewBox="0 0 100 28"
              className="absolute bottom-2 right-3 opacity-20"
              style={{ width: 64, height: 20 }}
              preserveAspectRatio="none"
            >
              <polyline
                points={m.spark}
                fill="none"
                stroke={`rgb(${m.color})`}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <div
        className="rounded-xl border border-zinc-800/60 bg-zinc-950/80 p-4"
      >
        <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-3">
          Carga semanal
        </p>
        {/* DOW header */}
        <div className="grid gap-1" style={{ gridTemplateColumns: "48px repeat(7, 1fr)" }}>
          <div />
          {DOW.map((d) => (
            <div key={d} className="text-center text-[9px] font-mono tracking-widest text-zinc-600">
              {d}
            </div>
          ))}
        </div>
        {/* Bands */}
        {HEAT_BANDS.map((band) => (
          <div
            key={band.label}
            className="grid gap-1 mt-1"
            style={{ gridTemplateColumns: "48px repeat(7, 1fr)" }}
          >
            <span className="text-[9px] font-mono text-zinc-600 flex items-center">
              {band.label}
            </span>
            {band.levels.map((lvl, i) => (
              <div
                key={i}
                className="rounded"
                style={{
                  height: 24,
                  background: `rgba(139,92,246,${HEAT_ALPHA[lvl]})`,
                  border: "1px solid rgba(255,255,255,0.04)",
                }}
              />
            ))}
          </div>
        ))}
        {/* Legend */}
        <div className="flex items-center gap-1 mt-3 justify-end">
          <span className="text-[8px] text-zinc-600 mr-1">Menos</span>
          {HEAT_ALPHA.map((a, i) => (
            <div
              key={i}
              className="rounded"
              style={{
                width: 12,
                height: 12,
                background: `rgba(139,92,246,${a})`,
              }}
            />
          ))}
          <span className="text-[8px] text-zinc-600 ml-1">Más</span>
        </div>
      </div>
    </div>
  );
}

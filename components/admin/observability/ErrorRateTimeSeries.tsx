"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ErrorRatePoint } from "@/lib/admin/observability-types";

function formatTick(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

const axisStyle = { fill: "#94a3b8", fontSize: 11 };

export interface ErrorRateTimeSeriesProps {
  points: ErrorRatePoint[];
  height?: number;
  className?: string;
}

/**
 * Error rate over time (fed by client-side buffers from Prometheus snapshots).
 */
export function ErrorRateTimeSeries({ points, height = 260, className = "" }: ErrorRateTimeSeriesProps) {
  if (!points.length) {
    return (
      <div
        className={`flex min-h-[200px] items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] text-sm text-gray-500 ${className}`}
        data-testid="error-rate-timeseries-empty"
      >
        Sin serie temporal de errores todavía (espera un ciclo de polling).
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`} style={{ height }} data-testid="error-rate-timeseries">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="errTsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fb923c" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#fb923c" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey="t" tickFormatter={formatTick} tick={axisStyle} axisLine={false} tickLine={false} minTickGap={24} />
          <YAxis
            tick={axisStyle}
            axisLine={false}
            tickLine={false}
            width={40}
            tickFormatter={(v) => `${v}%`}
            domain={[0, "auto"]}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(15,23,42,0.95)",
              border: "1px solid rgba(148,163,184,0.25)",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelFormatter={(label) => formatTick(String(label))}
            formatter={(value: number) => [`${value.toFixed(2)}%`, "Errores"]}
          />
          <Area type="monotone" dataKey="rate" name="Tasa error" stroke="#fb923c" strokeWidth={2} fill="url(#errTsFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

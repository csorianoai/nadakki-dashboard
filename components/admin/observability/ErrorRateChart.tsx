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
  return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

const axisStyle = { fill: "#94a3b8", fontSize: 11 };

export interface ErrorRateChartProps {
  points: ErrorRatePoint[];
  height?: number;
  className?: string;
}

export function ErrorRateChart({ points, height = 260, className = "" }: ErrorRateChartProps) {
  if (!points.length) {
    return (
      <div
        className={`flex min-h-[200px] items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] text-sm text-gray-500 ${className}`}
      >
        Sin serie de tasa de error.
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="errFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fb7185" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#fb7185" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey="t" tickFormatter={formatTick} tick={axisStyle} axisLine={false} tickLine={false} />
          <YAxis
            tick={axisStyle}
            axisLine={false}
            tickLine={false}
            width={36}
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
          <Area
            type="monotone"
            dataKey="rate"
            name="Tasa error"
            stroke="#fb7185"
            strokeWidth={2}
            fill="url(#errFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

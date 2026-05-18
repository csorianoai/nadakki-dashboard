"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { LatencyPoint } from "@/lib/admin/observability-types";

function formatTick(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

const axisStyle = { fill: "#94a3b8", fontSize: 11 };
const gridStyle = { stroke: "rgba(255,255,255,0.06)" };

export interface LatencyChartProps {
  points: LatencyPoint[];
  height?: number;
  className?: string;
}

export function LatencyChart({ points, height = 280, className = "" }: LatencyChartProps) {
  if (!points.length) {
    return (
      <div
        className={`flex min-h-[200px] items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] text-sm text-gray-500 ${className}`}
      >
        Sin puntos de latencia en el rango seleccionado.
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid {...gridStyle} vertical={false} />
          <XAxis dataKey="t" tickFormatter={formatTick} tick={axisStyle} axisLine={false} tickLine={false} />
          <YAxis
            tick={axisStyle}
            axisLine={false}
            tickLine={false}
            width={40}
            label={{ value: "ms", angle: -90, position: "insideLeft", fill: "#64748b", fontSize: 10 }}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(15,23,42,0.95)",
              border: "1px solid rgba(148,163,184,0.25)",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelFormatter={(label) => formatTick(String(label))}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "#cbd5e1" }} />
          <Line type="monotone" dataKey="p50" name="p50" stroke="#34d399" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="p95" name="p95" stroke="#a78bfa" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="p99" name="p99" stroke="#f472b6" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

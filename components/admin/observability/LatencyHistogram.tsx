"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { EndpointLatencyStats } from "@/lib/admin/prometheus-parse";

const axisStyle = { fill: "#94a3b8", fontSize: 11 };

export interface LatencyHistogramProps {
  endpoints: EndpointLatencyStats[];
  height?: number;
  className?: string;
}

export function LatencyHistogram({ endpoints, height = 320, className = "" }: LatencyHistogramProps) {
  if (!endpoints.length) {
    return (
      <div
        className={`flex min-h-[200px] items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] text-sm text-gray-500 ${className}`}
        data-testid="latency-histogram-empty"
      >
        Sin histograma de latencia (ningún histograma Prometheus en /metrics).
      </div>
    );
  }

  const data = endpoints.map((e) => ({
    name: e.endpoint.length > 28 ? `${e.endpoint.slice(0, 26)}…` : e.endpoint,
    full: e.endpoint,
    p50: Math.round(e.p50),
    p95: Math.round(e.p95),
    p99: Math.round(e.p99),
  }));

  return (
    <div className={`w-full ${className}`} style={{ height }} data-testid="latency-histogram">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 32 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} interval={0} angle={-18} textAnchor="end" height={48} />
          <YAxis
            tick={axisStyle}
            axisLine={false}
            tickLine={false}
            width={44}
            label={{ value: "ms", angle: -90, position: "insideLeft", fill: "#64748b", fontSize: 10 }}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(15,23,42,0.95)",
              border: "1px solid rgba(148,163,184,0.25)",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(v: number, name: string) => [`${v} ms`, name]}
            labelFormatter={(_, payload) => {
              const p = payload?.[0]?.payload as { full?: string } | undefined;
              return p?.full ?? "";
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "#cbd5e1" }} />
          <Bar dataKey="p50" name="p50" fill="#34d399" radius={[4, 4, 0, 0]} />
          <Bar dataKey="p95" name="p95" fill="#a78bfa" radius={[4, 4, 0, 0]} />
          <Bar dataKey="p99" name="p99" fill="#f472b6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TenantErrorSlice } from "@/lib/admin/prometheus-parse";

const axisStyle = { fill: "#94a3b8", fontSize: 11 };

export interface TenantComparisonProps {
  slices: TenantErrorSlice[];
  /** When set, highlights this tenant in the chart subtitle */
  activeTenantId?: string;
  height?: number;
  className?: string;
}

export function TenantComparison({
  slices,
  activeTenantId,
  height = 280,
  className = "",
}: TenantComparisonProps) {
  if (slices.length < 2) {
    return (
      <div
        className={`flex min-h-[160px] items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] px-4 text-center text-sm text-gray-500 ${className}`}
        data-testid="tenant-comparison-empty"
      >
        Comparación multi-tenant requiere métricas con label de tenant en /metrics (o rol SYSTEM_ADMIN con vista
        agregada).
        {activeTenantId ? (
          <span className="sr-only"> tenant activo {activeTenantId}</span>
        ) : null}
      </div>
    );
  }

  const data = slices.map((s) => ({
    tenant: s.tenant.length > 16 ? `${s.tenant.slice(0, 14)}…` : s.tenant,
    full: s.tenant,
    errores_pct: s.total > 0 ? Math.min(100, (s.errors / s.total) * 100) : 0,
  }));

  return (
    <div className={`w-full ${className}`} style={{ height }} data-testid="tenant-comparison">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey="tenant" tick={axisStyle} axisLine={false} tickLine={false} />
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
            formatter={(v: number) => [`${v.toFixed(2)}%`, "Errores / total"]}
            labelFormatter={(_, payload) => {
              const p = payload?.[0]?.payload as { full?: string } | undefined;
              return p?.full ?? "";
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "#cbd5e1" }} />
          <Bar dataKey="errores_pct" name="% errores (5xx)" fill="#f87171" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

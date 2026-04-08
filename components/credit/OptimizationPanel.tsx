"use client";

import type { OptimizationResponse } from "@/lib/credit-api";
import { formatPercentDecimal } from "@/lib/credit-format";

export interface OptimizationPanelProps {
  data: OptimizationResponse | null;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

export function OptimizationPanel({
  data,
  loading,
  error,
  className = "",
}: OptimizationPanelProps) {
  if (loading) {
    return (
      <div
        className={`animate-pulse h-48 rounded-xl bg-white/5 ${className}`}
      />
    );
  }
  if (error) {
    return (
      <div
        className={`rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200 ${className}`}
      >
        {error}
      </div>
    );
  }
  if (!data?.top_actions?.length) {
    return (
      <div
        className={`rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-500 ${className}`}
      >
        Sin recomendaciones — complete solicitante y vehículo.
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border border-white/10 bg-white/5 p-4 space-y-3 ${className}`}
    >
      <h3 className="text-sm font-medium text-slate-200">
        Optimización sugerida
      </h3>
      <p className="text-xs text-slate-500">
        Ingreso base:{" "}
        <span className="text-slate-300">{data.income_basis}</span>
        {" · "}Tasa ref.:{" "}
        <span className="text-slate-300">
          {formatPercentDecimal(data.reference_annual_rate)}
        </span>
      </p>
      <ol className="space-y-2 list-decimal list-inside text-sm text-slate-300">
        {data.top_actions.map((a, i) => (
          <li key={i} className="pl-1">
            <span className="font-medium text-slate-100">
              {String(a.action ?? "")}
            </span>
            {a.rationale != null && (
              <p className="text-slate-400 text-xs mt-0.5">
                {String(a.rationale)}
              </p>
            )}
            {a.impact_hint != null && (
              <p className="text-slate-500 text-[11px] mt-0.5">
                {String(a.impact_hint)}
              </p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

"use client";

import type { ExplanationResponse } from "@/lib/credit-api";

export interface ExplanationCardProps {
  data: ExplanationResponse | null;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

export function ExplanationCard({
  data,
  loading,
  error,
  className = "",
}: ExplanationCardProps) {
  if (loading) {
    return (
      <div
        className={`animate-pulse h-40 rounded-xl bg-white/5 ${className}`}
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
  if (!data?.factors?.length && !data?.normalized) {
    return (
      <div
        className={`rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-500 ${className}`}
      >
        Sin explicación disponible — procese la solicitud primero.
      </div>
    );
  }

  const norm = data.normalized as Record<string, unknown> | undefined;
  const decision = norm?.decision ?? norm?.recommendation;

  return (
    <div
      className={`rounded-xl border border-white/10 bg-white/5 p-4 space-y-3 ${className}`}
    >
      <h3 className="text-sm font-medium text-slate-200">
        Explicación de decisión
      </h3>
      {decision != null && (
        <p className="text-xs text-slate-400">
          Resultado:{" "}
          <span className="text-slate-100 font-medium">{String(decision)}</span>
        </p>
      )}
      <ul className="space-y-2">
        {(data.factors ?? []).map((f) => (
          <li
            key={f.reason_code}
            className="text-sm border-l-2 border-cyan-500/40 pl-3"
          >
            <span className="font-mono text-[11px] text-cyan-400/90">
              {f.reason_code}
            </span>
            <p className="text-slate-300 mt-0.5">{f.human_factor}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

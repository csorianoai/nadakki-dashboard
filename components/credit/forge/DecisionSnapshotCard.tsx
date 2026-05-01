"use client";

import { Cpu, TrendingUp } from "lucide-react";

export function DecisionSnapshotCard({
  title,
  decision,
  score,
  confidenceLabel,
  footnote,
}: {
  title: string;
  decision?: string | null;
  score?: number | null;
  confidenceLabel?: string | null;
  footnote?: string | null;
}) {
  const hasAny = decision != null || score != null || confidenceLabel != null;
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-violet-950/30 p-6 shadow-xl ring-1 ring-violet-500/10">
      <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 translate-x-1/3 -translate-y-1/3 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-violet-300/90">
            <Cpu className="h-3.5 w-3.5" aria-hidden />
            {title}
          </p>
          {hasAny ? (
            <dl className="mt-4 space-y-2 text-sm">
              {decision != null && String(decision).trim() !== "" ? (
                <div className="flex flex-wrap items-baseline gap-2">
                  <dt className="text-slate-500">Recomendación</dt>
                  <dd className="text-lg font-semibold tracking-tight text-white">{String(decision)}</dd>
                </div>
              ) : null}
              {score != null && !Number.isNaN(score) ? (
                <div className="flex flex-wrap items-baseline gap-2">
                  <dt className="text-slate-500">Score</dt>
                  <dd className="font-mono text-2xl font-bold tabular-nums text-emerald-300">{score.toFixed(1)}</dd>
                </div>
              ) : null}
              {confidenceLabel ? (
                <div className="flex flex-wrap items-baseline gap-2">
                  <dt className="text-slate-500">Confianza</dt>
                  <dd className="text-slate-200">{confidenceLabel}</dd>
                </div>
              ) : null}
            </dl>
          ) : (
            <p className="mt-3 text-sm text-slate-500">
              Aún no hay decisión IA disponible para este expediente (procese o revise estado).
            </p>
          )}
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/20">
          <TrendingUp className="h-6 w-6" aria-hidden />
        </div>
      </div>
      {footnote ? <p className="relative mt-4 border-t border-white/10 pt-3 text-xs text-slate-500">{footnote}</p> : null}
    </div>
  );
}

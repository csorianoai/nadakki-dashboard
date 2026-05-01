"use client";

import { Car, Gauge } from "lucide-react";

export function VehicleShowcaseCard({
  make,
  model,
  year,
  valueLabel,
}: {
  make?: string | null;
  model?: string | null;
  year?: number | null;
  valueLabel?: string | null;
}) {
  const hasData = Boolean(make || model || year || valueLabel);
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/90 to-slate-950 p-5 shadow-xl ring-1 ring-white/5">
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-violet-500/20 blur-2xl" />
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/5 text-violet-300 ring-1 ring-white/10">
          <Car className="h-7 w-7" strokeWidth={1.25} aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Vehículo</p>
          {hasData ? (
            <>
              <p className="truncate text-lg font-semibold tracking-tight text-slate-50">
                {[make, model].filter(Boolean).join(" ") || "Vehículo"}
                {year ? <span className="text-slate-400"> · {year}</span> : null}
              </p>
              {valueLabel ? (
                <p className="inline-flex items-center gap-1.5 text-sm text-emerald-300/90">
                  <Gauge className="h-3.5 w-3.5" aria-hidden />
                  {valueLabel}
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-sm leading-relaxed text-slate-400">
              Complete el paso de vehículo para reflejar marca, modelo y valor aquí.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

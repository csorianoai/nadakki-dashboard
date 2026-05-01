"use client";

import { Building2, Shield } from "lucide-react";

export function BankUnderwritingHero() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/50 p-8 shadow-2xl shadow-black/30 ring-1 ring-white/5 md:p-10">
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(ellipse_at_center,_rgba(16,185,129,0.12),_transparent_70%)]" />
      <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl space-y-3">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400/90">
            <Shield className="h-4 w-4" aria-hidden />
            Bank underwriting console
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white md:text-4xl">
            Mesa de decisiones
          </h1>
          <p className="text-sm leading-relaxed text-slate-400 md:text-base">
            Cola en vivo del tenant seleccionado. Score y montos se enriquecen cuando el expediente fue procesado; sin datos
            inventados.
          </p>
        </div>
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/25">
          <Building2 className="h-10 w-10" aria-hidden />
        </div>
      </div>
    </div>
  );
}

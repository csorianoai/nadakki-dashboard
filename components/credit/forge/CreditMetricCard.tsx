"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function CreditMetricCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-5 shadow-lg shadow-black/10 transition hover:border-violet-500/30 hover:shadow-violet-500/10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{label}</p>
          <div className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-slate-50 md:text-3xl">{value}</div>
          {hint ? <p className="mt-2 text-xs leading-relaxed text-slate-500">{hint}</p> : null}
        </div>
        {Icon ? (
          <div className="rounded-xl bg-violet-500/15 p-2.5 text-violet-300 ring-1 ring-violet-400/20">
            <Icon className="h-5 w-5" aria-hidden />
          </div>
        ) : null}
      </div>
    </div>
  );
}

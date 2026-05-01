"use client";

import { Check } from "lucide-react";

export function WizardProgressRail({
  steps,
  currentIndex,
}: {
  steps: readonly string[];
  currentIndex: number;
}) {
  return (
    <nav aria-label="Progreso del asistente" className="w-full">
      <ol className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
        {steps.map((label, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          return (
            <li
              key={label}
              className={`flex min-h-[44px] flex-1 items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition sm:min-w-0 sm:flex-none sm:px-4 ${
                active
                  ? "border-violet-500/50 bg-violet-500/15 text-violet-100 shadow-lg shadow-violet-900/20"
                  : done
                    ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-100/90"
                    : "border-white/10 bg-white/[0.03] text-slate-500"
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  active ? "bg-violet-500 text-white" : done ? "bg-emerald-500 text-white" : "bg-white/10 text-slate-500"
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : i + 1}
              </span>
              <span className="leading-snug">{label}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

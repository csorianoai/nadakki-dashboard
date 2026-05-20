"use client";

import type { AnalyticsPeriod } from "@/types/dealer-analytics";

const OPTIONS: { value: AnalyticsPeriod; label: string }[] = [
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
  { value: "12m", label: "12m" },
];

interface PeriodSelectorProps {
  value: AnalyticsPeriod;
  onChange: (p: AnalyticsPeriod) => void;
  disabled?: boolean;
}

export function PeriodSelector({ value, onChange, disabled }: PeriodSelectorProps) {
  return (
    <fieldset
      className="flex flex-wrap items-center gap-1 rounded-lg border border-white/15 bg-black/40 p-1"
      aria-label="Periodo de analítica"
      data-testid="dealer-period-selector"
    >
      <legend className="sr-only">Seleccionar periodo</legend>
      {OPTIONS.map((opt) => {
        const pressed = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={pressed}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={[
              "min-h-[44px] min-w-[44px] rounded-md px-3 py-2 text-xs font-semibold transition-colors md:min-h-0 md:min-w-0",
              pressed ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/30" : "text-gray-400 hover:bg-white/10 hover:text-white",
              disabled ? "cursor-not-allowed opacity-40" : "",
            ].join(" ")}
          >
            {opt.label}
          </button>
        );
      })}
    </fieldset>
  );
}

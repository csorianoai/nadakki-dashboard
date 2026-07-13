"use client";

import { useState } from "react";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import { nonePopulationActivityEnvelope } from "@/lib/cockpit/finance-v3/normalize/population";
import { PopulationNonePlaceholder } from "./PopulationPanel";

const PERIODS = [
  { value: "today", label: "Hoy" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
] as const;

/** H3-7: no /population/activity endpoint — honest NONE for entire tab. */
export function PopulationActivityTab() {
  const [period, setPeriod] = useState<string>("week");
  const envelope = nonePopulationActivityEnvelope();

  return (
    <div className="space-y-4" data-testid="population-tab-activity">
      <div className="flex flex-wrap items-center gap-3">
        <select
          className="rounded border border-cockpit-border bg-cockpit-bg px-3 py-2 text-sm"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          disabled
          aria-label="Período de actividad"
        >
          {PERIODS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <DataTruthBadge level="NONE" />
      </div>
      <div className="rounded-xl border border-cockpit-border bg-cockpit-surface p-6">
        <PopulationNonePlaceholder message={envelope.message} />
      </div>
    </div>
  );
}

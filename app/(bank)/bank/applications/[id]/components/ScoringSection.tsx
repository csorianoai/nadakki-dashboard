"use client";

import { useMemo } from "react";
import {
  DTI_AMBER_MAX,
  DTI_GREEN_MAX,
  PTI_AMBER_MAX,
  PTI_GREEN_MAX,
} from "@/lib/bank-application-detail/constants";
import type { BankApplicationScoring, BankApplicationTenantThresholds } from "@/lib/bank-application-detail/types";

export interface ScoringSectionProps {
  scoring: BankApplicationScoring;
}

type Tone = "green" | "amber" | "red";

function ptiTone(value: number | undefined, t?: BankApplicationTenantThresholds | null): Tone {
  const g = t?.pti_green_max ?? PTI_GREEN_MAX;
  const a = t?.pti_amber_max ?? PTI_AMBER_MAX;
  if (value == null || Number.isNaN(value)) return "amber";
  if (value <= g) return "green";
  if (value <= a) return "amber";
  return "red";
}

function dtiTone(value: number | undefined, t?: BankApplicationTenantThresholds | null): Tone {
  const g = t?.dti_green_max ?? DTI_GREEN_MAX;
  const a = t?.dti_amber_max ?? DTI_AMBER_MAX;
  if (value == null || Number.isNaN(value)) return "amber";
  if (value <= g) return "green";
  if (value <= a) return "amber";
  return "red";
}

function pillCls(tone: Tone): string {
  if (tone === "green") return "bg-emerald-50 text-emerald-950 ring-emerald-200";
  if (tone === "amber") return "bg-amber-50 text-amber-950 ring-amber-200";
  return "bg-rose-50 text-rose-950 ring-rose-200";
}

export function ScoringSection({ scoring }: ScoringSectionProps) {
  const t = scoring.tenant_thresholds;
  const ptiT = useMemo(() => ptiTone(scoring.pti, t), [scoring.pti, t]);
  const dtiT = useMemo(() => dtiTone(scoring.dti, t), [scoring.dti, t]);

  return (
    <section
      className="rounded-xl border border-forgeGray-200 bg-white p-6 shadow-sm"
      aria-labelledby="scoring-section-title"
    >
      <h2 id="scoring-section-title" className="text-lg font-semibold text-forgeGray-900">
        Scoring
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-forge-xs font-medium uppercase text-forgeGray-500">PTI</p>
          <p
            className={`mt-1 inline-flex min-h-9 items-center rounded-md px-2 py-1 font-forgeMono text-forge-sm tabular-nums ring-1 ring-inset ${pillCls(ptiT)}`}
          >
            {scoring.pti != null ? `${Number(scoring.pti).toFixed(1)}%` : "—"}
          </p>
        </div>
        <div>
          <p className="text-forge-xs font-medium uppercase text-forgeGray-500">DTI</p>
          <p
            className={`mt-1 inline-flex min-h-9 items-center rounded-md px-2 py-1 font-forgeMono text-forge-sm tabular-nums ring-1 ring-inset ${pillCls(dtiT)}`}
          >
            {scoring.dti != null ? `${Number(scoring.dti).toFixed(1)}%` : "—"}
          </p>
        </div>
        <div>
          <p className="text-forge-xs font-medium uppercase text-forgeGray-500">Score interno</p>
          <p className="mt-1 font-forgeMono text-xl font-semibold tabular-nums text-forgeGray-900">
            {scoring.internal_score ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-forge-xs font-medium uppercase text-forgeGray-500">Bureau</p>
          <p className="mt-1 font-forgeMono text-xl font-semibold tabular-nums text-forgeGray-900">
            {scoring.bureau_score ?? "—"}
          </p>
        </div>
      </div>
    </section>
  );
}

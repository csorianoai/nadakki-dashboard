"use client";

import { useMemo } from "react";
import type { BankQueueTenantThresholds } from "@/lib/bank-queue/types";
import { DTI_AMBER_MAX, DTI_GREEN_MAX } from "@/lib/bank-queue/constants";

export type DtiTone = "green" | "amber" | "red";

export function resolveDtiTone(value: number, thresholds?: BankQueueTenantThresholds | null): DtiTone {
  const greenMax = thresholds?.dti_green_max ?? DTI_GREEN_MAX;
  const amberMax = thresholds?.dti_amber_max ?? DTI_AMBER_MAX;
  if (value <= greenMax) return "green";
  if (value <= amberMax) return "amber";
  return "red";
}

export interface DtiCellProps {
  value: number;
  thresholds?: BankQueueTenantThresholds | null;
}

export function DtiCell({ value, thresholds }: DtiCellProps) {
  const tone = useMemo(() => resolveDtiTone(value, thresholds), [value, thresholds]);

  const cls =
    tone === "green"
      ? "bg-emerald-50 text-emerald-900 ring-emerald-200"
      : tone === "amber"
        ? "bg-amber-50 text-amber-950 ring-amber-200"
        : "bg-rose-50 text-rose-950 ring-rose-200";

  return (
    <span
      className={`inline-flex min-h-9 min-w-[3rem] items-center justify-center rounded-md px-2 py-1 font-forgeMono text-forge-xs tabular-nums ring-1 ring-inset ${cls}`}
      title={`DTI ${value}`}
      data-testid="dti-cell"
      data-tone={tone}
    >
      {Number.isFinite(value) ? value.toFixed(1) : "—"}
    </span>
  );
}

"use client";

import { useMemo } from "react";
import type { BankQueueTenantThresholds } from "@/lib/bank-queue/types";
import { PTI_AMBER_MAX, PTI_GREEN_MAX } from "@/lib/bank-queue/constants";

export type PtiTone = "green" | "amber" | "red";

export function resolvePtiTone(value: number, thresholds?: BankQueueTenantThresholds | null): PtiTone {
  const greenMax = thresholds?.pti_green_max ?? PTI_GREEN_MAX;
  const amberMax = thresholds?.pti_amber_max ?? PTI_AMBER_MAX;
  if (value <= greenMax) return "green";
  if (value <= amberMax) return "amber";
  return "red";
}

export interface PtiCellProps {
  value: number;
  thresholds?: BankQueueTenantThresholds | null;
}

export function PtiCell({ value, thresholds }: PtiCellProps) {
  const tone = useMemo(() => resolvePtiTone(value, thresholds), [value, thresholds]);

  const cls =
    tone === "green"
      ? "bg-emerald-50 text-emerald-900 ring-emerald-200"
      : tone === "amber"
        ? "bg-amber-50 text-amber-950 ring-amber-200"
        : "bg-rose-50 text-rose-950 ring-rose-200";

  return (
    <span
      className={`inline-flex min-h-9 min-w-[3rem] items-center justify-center rounded-md px-2 py-1 font-forgeMono text-forge-xs tabular-nums ring-1 ring-inset ${cls}`}
      title={`PTI ${value}`}
      data-testid="pti-cell"
      data-tone={tone}
    >
      {Number.isFinite(value) ? `${Math.round(value)}%` : "—"}
    </span>
  );
}

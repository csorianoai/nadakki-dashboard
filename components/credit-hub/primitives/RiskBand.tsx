"use client";

import { cn } from "@/lib/utils";
import { CH_RISK_BAND } from "@/lib/credit-hub/ch-base";
import type { RiskBandProps } from "@/lib/credit-hub/ch-types";

export function RiskBand({ level, label, className }: RiskBandProps) {
  const meta = CH_RISK_BAND[level];
  return (
    <div className={cn("inline-flex flex-col gap-1", className)}>
      <span className={cn("ch-pill w-fit", meta.cssClass)}>{label ?? meta.label}</span>
      <p className="text-xs" style={{ color: "var(--ch-ink-3)" }}>
        {meta.description}
      </p>
    </div>
  );
}

"use client";

import { cn } from "@/lib/utils";
import { RISK } from "@/lib/credit-hub/ch-base";
import type { RiskBandProps } from "@/lib/credit-hub/ch-types";

export function RiskBand({ level = "low", size = "md", showDot = true, label, className }: RiskBandProps) {
  const r = RISK[level];
  const h = size === "sm" ? 20 : size === "lg" ? 28 : 24;
  const fs = size === "sm" ? 10.5 : size === "lg" ? 13 : 12;

  return (
    <span
      className={cn("ch-tnum", className)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: h,
        padding: `0 ${size === "lg" ? 12 : 9}px`,
        borderRadius: 999,
        fontSize: fs,
        fontWeight: 600,
        color: r.color,
        background: r.soft,
        border: `1px solid color-mix(in oklab, ${r.color} 30%, transparent)`,
      }}
    >
      {showDot ? <span style={{ width: 7, height: 7, borderRadius: 999, background: r.color }} /> : null}
      Riesgo {(label ?? r.label).toLowerCase()}
    </span>
  );
}

"use client";

import type { ReactNode } from "react";
import { ICN, Ic } from "./Icons";

interface KpiStatProps {
  label: string;
  value: ReactNode;
  unit?: string;
  delta?: number;
  deltaLabel?: string;
  sub?: string;
  accent?: boolean;
}

export function KpiStat({ label, value, unit, delta, deltaLabel, sub, accent }: KpiStatProps) {
  const pos = (delta || 0) >= 0;
  return (
    <div
      style={{
        padding: "16px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        minWidth: 0,
      }}
    >
      <div className="eyebrow">{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span
          className="mono"
          style={{
            fontSize: 30,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            lineHeight: 1,
            color: accent ? "var(--mee-accent)" : "var(--mee-ink)",
          }}
        >
          {value}
        </span>
        {unit && (
          <span
            className="mono"
            style={{ fontSize: 14, color: "var(--mee-ink-3)", fontWeight: 500 }}
          >
            {unit}
          </span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 16 }}>
        {delta !== undefined && (
          <span
            className="mono"
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: pos ? "var(--mee-pos)" : "var(--mee-neg)",
              display: "inline-flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Ic d={pos ? ICN.arrowUp : ICN.arrowDn} s={11} w={2.4} />
            {Math.abs(delta)}%
          </span>
        )}
        {(sub || deltaLabel) && (
          <span style={{ fontSize: 11, color: "var(--mee-ink-3)" }}>{sub || deltaLabel}</span>
        )}
      </div>
    </div>
  );
}

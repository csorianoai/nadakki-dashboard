"use client";

import { memo, type ReactNode } from "react";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import type { DataTruthLevel } from "@/lib/credit-hub/honesty/data-truth";

export const CockpitHeader = memo(function CockpitHeader({
  eyebrow,
  title,
  subtitle,
  truth = "REAL",
  syncLabel = "Sincronizado",
  badges,
  actions,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  truth?: DataTruthLevel;
  syncLabel?: string;
  badges?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span className="ch-eyebrow" style={{ color: "var(--ch-dealer-accent-text, var(--ch-bank-accent-text))" }}>
          {eyebrow}
        </span>
        <DataTruthBadge level={truth} />
        <span className="ch-chip" style={{ fontSize: 10 }}>
          {syncLabel}
        </span>
        {badges}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 12, alignItems: "flex-end" }}>
        <div>
          <h1 className="ch-serif" style={{ margin: 0, fontSize: "clamp(24px, 5vw, 32px)", letterSpacing: "-0.02em" }}>
            {title}
          </h1>
          {subtitle ? (
            <p style={{ fontSize: 13.5, color: "var(--ch-text-2)", margin: "6px 0 0", maxWidth: 560 }}>{subtitle}</p>
          ) : null}
        </div>
        {actions ? <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{actions}</div> : null}
      </div>
    </header>
  );
});

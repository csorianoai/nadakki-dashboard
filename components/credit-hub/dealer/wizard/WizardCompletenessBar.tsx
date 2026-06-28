"use client";

import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";

export function WizardCompletenessBar({ percent }: { percent: number }) {
  const color =
    percent >= 80 ? "var(--ch-success)" : percent >= 50 ? "var(--ch-warning)" : "var(--ch-persona)";

  return (
    <div
      className="ch-card"
      style={{ padding: "12px 14px", marginBottom: 16, border: "1px solid var(--ch-line)" }}
      data-testid="wizard-completeness"
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="ch-eyebrow">Completitud del expediente</span>
          <DataTruthBadge level="REAL" />
        </div>
        <span className="ch-mono" style={{ fontSize: 18, fontWeight: 600, color }}>
          {percent}%
        </span>
      </div>
      <div style={{ height: 8, background: "var(--ch-surface-3)", borderRadius: 4, overflow: "hidden" }}>
        <div
          style={{
            width: `${percent}%`,
            height: "100%",
            background: color,
            borderRadius: 4,
            transition: "width 0.35s var(--ch-ease, ease)",
          }}
        />
      </div>
    </div>
  );
}

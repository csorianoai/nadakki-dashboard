"use client";

import { memo } from "react";
import type { DataTruthLevel } from "@/lib/credit-hub/honesty/data-truth";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";

export interface DisplayStatusFunnelProps {
  counts: Record<string, number>;
  truth: DataTruthLevel;
}

const ORDER = ["DRAFT", "RECEIVED", "ACTIVE", "APPROVED", "FUNDED", "REJECTED"] as const;

const LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  RECEIVED: "Recibida",
  ACTIVE: "En curso",
  APPROVED: "Aprobada",
  FUNDED: "Fondeada",
  REJECTED: "Rechazada",
  "ACTIVE:BANK_SUBMITTED": "En banco",
  "ACTIVE:AI_ANALYSIS": "Análisis IA",
};

export const DisplayStatusFunnel = memo(function DisplayStatusFunnel({ counts, truth }: DisplayStatusFunnelProps) {
  const merged: Record<string, number> = {};
  for (const [k, v] of Object.entries(counts)) {
    const base = k.startsWith("ACTIVE:") ? "ACTIVE" : k;
    merged[base] = (merged[base] ?? 0) + v;
  }

  const stages = ORDER.map((key) => ({
    key,
    label: LABELS[key] ?? key,
    count: merged[key] ?? (key === "RECEIVED" ? counts.RECEIVED ?? 0 : 0),
  })).filter((s) => s.count > 0 || ORDER.includes(s.key as (typeof ORDER)[number]));

  const max = Math.max(...stages.map((s) => s.count), 1);

  return (
    <section data-testid="display-status-funnel">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <h2 className="ch-serif" style={{ margin: 0, fontSize: 19 }}>
          Pipeline por estado
        </h2>
        <DataTruthBadge level={truth} />
      </div>
      <div className="ch-card" style={{ padding: "16px 18px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {stages.map((stage) => (
            <div key={stage.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 88, fontSize: 11.5, textAlign: "right", color: "var(--ch-text-2)" }}>
                {stage.label}
              </span>
              <div style={{ flex: 1, height: 20, background: "var(--ch-surface-3)", borderRadius: 4, overflow: "hidden" }}>
                <div
                  style={{
                    width: `${Math.max((stage.count / max) * 100, stage.count ? 4 : 0)}%`,
                    height: "100%",
                    background: "var(--ch-dealer-accent, var(--ch-persona))",
                    opacity: 0.85,
                  }}
                />
              </div>
              <span className="ch-mono" style={{ width: 36, textAlign: "right", fontWeight: 600 }}>
                {stage.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

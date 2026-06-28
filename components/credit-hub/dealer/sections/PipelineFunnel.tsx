"use client";

import type { CreditStats } from "@/lib/credit-hub/types/creditCore";
import { DealerSectionHeader } from "@/components/credit-hub/dealer/shared/dealerUi";

interface PipelineStage {
  key: string;
  label: string;
  count: number;
  color: string;
}

export function PipelineFunnel({ stats }: { stats?: CreditStats }) {
  if (!stats) return null;

  const stages: PipelineStage[] = [
    { key: "draft", label: "Borrador", count: stats.draft_applications, color: "var(--ch-text-4)" },
    { key: "submitted", label: "Enviadas", count: stats.submitted_applications, color: "var(--ch-info)" },
    { key: "processing", label: "En proceso", count: stats.processing_applications, color: "var(--ch-warning)" },
    { key: "approved", label: "Aprobadas", count: stats.approved_applications, color: "var(--ch-success)" },
    { key: "rejected", label: "Rechazadas", count: stats.rejected_applications, color: "var(--ch-danger)" },
  ];

  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  return (
    <div style={{ marginBottom: 26 }}>
      <DealerSectionHeader title="Pipeline de solicitudes" sub="distribución por etapa" />
      <div className="ch-card" style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {stages.map((stage) => {
            const pct = Math.max((stage.count / maxCount) * 100, 2);
            return (
              <div key={stage.key} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  style={{
                    width: 90,
                    fontSize: 12,
                    fontWeight: 500,
                    color: "var(--ch-text-2)",
                    flexShrink: 0,
                    textAlign: "right",
                  }}
                >
                  {stage.label}
                </span>
                <div style={{ flex: 1, height: 24, background: "var(--ch-surface-2)", borderRadius: 4, overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${pct}%`,
                      height: "100%",
                      background: stage.color,
                      borderRadius: 4,
                      transition: "width 0.3s var(--ch-ease)",
                      opacity: 0.75,
                    }}
                  />
                </div>
                <span className="ch-mono" style={{ width: 48, fontSize: 14, fontWeight: 600, color: "var(--ch-text)", textAlign: "right" }}>
                  {stage.count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

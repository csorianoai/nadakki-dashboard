"use client";

import { useMemo } from "react";
import type { BankDashboardAnalytics } from "@/lib/credit-hub/types/bankDecision";
import type { BankQueueItem } from "@/lib/credit-hub/types/bankDecision";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";

function buildBankFunnel(analytics: BankDashboardAnalytics | undefined, queue: BankQueueItem[]) {
  const byStatus = analytics?.applications_by_status ?? {};
  const received = byStatus.received ?? byStatus.submitted ?? queue.length;
  const inReview = queue.filter((q) => !q.bank_decision && q.state !== "decided" && q.state !== "DECIDED").length;
  const decided = Object.values(byStatus).reduce((s, n) => s + (typeof n === "number" ? n : 0), 0) - inReview || queue.filter((q) => q.bank_decision || q.state === "decided").length;
  const offered = byStatus.offered ?? byStatus.counter_offer ?? 0;
  const accepted = byStatus.accepted ?? byStatus.approved ?? 0;

  const raw = [
    { key: "received", label: "Recibidas", count: received || queue.length, color: "var(--ch-info)" },
    { key: "review", label: "En revisión", count: inReview, color: "var(--ch-warning)" },
    { key: "decided", label: "Decididas", count: Math.max(decided, 0), color: "var(--ch-bank-accent, var(--ch-persona))" },
    { key: "offered", label: "Ofertadas", count: offered, color: "var(--ch-warning)" },
    { key: "accepted", label: "Aceptadas", count: accepted, color: "var(--ch-success)" },
  ];

  return raw.map((stage, i) => {
    const prev = i > 0 ? raw[i - 1]!.count : stage.count;
    const pct = prev > 0 ? Math.round((stage.count / prev) * 100) : stage.count > 0 ? 100 : 0;
    return { ...stage, pct };
  });
}

export function BankDecisionFunnel({
  analytics,
  queue,
  truth,
}: {
  analytics?: BankDashboardAnalytics;
  queue: BankQueueItem[];
  truth: "REAL" | "DEMO";
}) {
  const stages = useMemo(() => buildBankFunnel(analytics, queue), [analytics, queue]);
  const max = Math.max(...stages.map((s) => s.count), 1);

  return (
    <div className="ch-card overflow-hidden" data-testid="bank-decision-funnel">
      <div className="ch-card-h">
        <div>
          <div className="ch-card-title">Embudo de decisión</div>
          <div className="ch-card-sub">Conversión por etapa · solo tu institución</div>
        </div>
        <DataTruthBadge level={truth} />
      </div>
      <div style={{ padding: "14px 16px" }}>
        {stages.map((stage) => (
          <div
            key={stage.key}
            className="ch-field-row"
            style={{ padding: "10px 0", alignItems: "center" }}
          >
            <span style={{ width: 96, fontSize: 12, color: "var(--ch-text-2)" }}>{stage.label}</span>
            <div style={{ flex: 1, height: 18, background: "var(--ch-surface-3)", borderRadius: 4, overflow: "hidden" }}>
              <div
                style={{
                  width: `${Math.max((stage.count / max) * 100, stage.count ? 4 : 0)}%`,
                  height: "100%",
                  background: stage.color,
                  opacity: 0.9,
                }}
              />
            </div>
            <span className="ch-mono" style={{ width: 72, fontSize: 12, fontWeight: 600, textAlign: "right" }}>
              {stage.count} ({stage.pct}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

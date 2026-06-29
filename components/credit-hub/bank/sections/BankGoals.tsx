"use client";

import { SectionHeader } from "@/components/credit-hub/bank/shared/bankUi";
import type { BankDashboardAnalytics } from "@/lib/credit-hub/types/bankDecision";

interface BankGoalsProps {
  analytics?: BankDashboardAnalytics;
  queueCount: number;
}

/**
 * Monthly bank goals with pacing bars. Goal targets are DEMO
 * (no goals endpoint exists). Current values come from real analytics.
 */
export function BankGoals({ analytics, queueCount }: BankGoalsProps) {
  const approvalPct = analytics ? Math.round(analytics.approval_rate * 100) : 0;
  const avgHours = analytics?.avg_decision_time_hours ?? null;

  const goals = [
    { label: "Cola resuelta", current: queueCount === 0 ? 100 : Math.max(0, 100 - queueCount * 2), target: 100, unit: "%", good: queueCount === 0 },
    { label: "Tasa de aprobación", current: approvalPct, target: 75, unit: "%", good: approvalPct >= 75 },
    { label: "Tiempo decisión", current: avgHours != null ? Math.round(avgHours) : 0, target: 6, unit: "h", good: avgHours != null && avgHours <= 6, inverted: true },
    { label: "Solicitudes procesadas", current: analytics?.total_applications ?? 0, target: 100, unit: "", good: (analytics?.total_applications ?? 0) >= 100 },
  ];

  return (
    <div style={{ marginBottom: 26 }}>
      <SectionHeader eyebrow="Rendimiento" title="Metas operativas del mes" sub="Pacing vs. objetivos" />
      <div className="ch-card" style={{ padding: "16px 20px" }}>
        <p style={{ fontSize: 11, color: "var(--ch-accent-text)", background: "var(--ch-accent-soft)", border: "1px solid var(--ch-accent-line)", borderRadius: 4, padding: "4px 8px", margin: "0 0 12px" }}>
          DEMO — objetivos ilustrativos. No existe endpoint de metas aún.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
          {goals.map((g, index) => {
            const pct = g.inverted
              ? (g.target > 0 ? Math.min(Math.max((1 - (g.current / g.target - 1)) * 100, 0), 100) : 0)
              : (g.target > 0 ? Math.min((g.current / g.target) * 100, 100) : 0);
            return (
              <div
                key={g.label}
                style={{
                  padding: "14px 16px",
                  borderBottom: index < goals.length - 1 ? "1px solid var(--ch-line-subtle)" : undefined,
                }}
              >
                <div style={{ fontSize: 12, color: "var(--ch-text-3)", marginBottom: 4 }}>{g.label}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 6 }}>
                  <span className="ch-mono" style={{ fontSize: 20, fontWeight: 600, color: "var(--ch-text)" }}>
                    {g.current}{g.unit}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--ch-text-4)" }}>/ {g.target}{g.unit}</span>
                </div>
                <div style={{ height: 6, background: "var(--ch-surface-3)", borderRadius: 3, overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${pct}%`,
                      height: "100%",
                      background: g.good ? "var(--ch-success)" : "var(--ch-persona)",
                      borderRadius: 3,
                      transition: "width 0.3s var(--ch-ease)",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

"use client";

import type { CreditApplication, CreditStats } from "@/lib/credit-hub/types/creditCore";
import { DealerSectionHeader } from "@/components/credit-hub/dealer/shared/dealerUi";
import { formatDealerMoney, volumeThisMonth } from "@/lib/credit-hub/dealer/dealerFormat";

interface DealerGoalsProps {
  stats?: CreditStats;
  applications: CreditApplication[];
  currency: string;
}

/**
 * Monthly goals section. Target values are illustrative (DEMO) since
 * no goals-management endpoint exists yet. Real values come from
 * stats + applications list.
 */
export function DealerGoals({ stats, applications, currency }: DealerGoalsProps) {
  const monthVolumeStr = volumeThisMonth(applications, currency);
  const submitted = stats?.submitted_applications ?? 0;
  const approved = stats?.approved_applications ?? 0;
  const approvalRate = stats?.approval_rate;

  // Illustrative targets — no backend endpoint for goals yet
  const goals = [
    {
      label: "Solicitudes enviadas",
      current: submitted,
      target: 50,
      unit: "",
      demo: true,
    },
    {
      label: "Aprobaciones",
      current: approved,
      target: 30,
      unit: "",
      demo: true,
    },
    {
      label: "Tasa de aprobación",
      current: approvalRate != null ? Math.round(approvalRate * 100) : 0,
      target: 80,
      unit: "%",
      demo: true,
    },
    {
      label: "Volumen mensual",
      current: null,
      formatted: monthVolumeStr,
      target: null,
      targetFormatted: formatDealerMoney(5000000, currency),
      unit: "",
      demo: true,
    },
  ];

  return (
    <div style={{ marginBottom: 26 }}>
      <DealerSectionHeader title="Metas del mes" sub="objetivos ilustrativos" />
      <div className="ch-card" style={{ padding: "16px 20px" }}>
        <p style={{ fontSize: 11, color: "var(--ch-accent-text)", background: "var(--ch-accent-soft)", border: "1px solid var(--ch-accent-line)", borderRadius: 4, padding: "4px 8px", margin: "0 0 12px" }}>
          DEMO — metas ilustrativas. No existe endpoint de objetivos aún.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
          {goals.map((g) => {
            const pct = g.target && typeof g.current === "number" ? Math.min((g.current / g.target) * 100, 100) : 0;
            return (
              <div key={g.label}>
                <div style={{ fontSize: 12, color: "var(--ch-text-3)", marginBottom: 4 }}>{g.label}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 6 }}>
                  <span className="ch-mono" style={{ fontSize: 20, fontWeight: 600, color: "var(--ch-text)" }}>
                    {g.formatted ?? `${g.current}${g.unit}`}
                  </span>
                  {g.target != null && (
                    <span style={{ fontSize: 12, color: "var(--ch-text-4)" }}>
                      / {g.targetFormatted ?? `${g.target}${g.unit}`}
                    </span>
                  )}
                </div>
                {g.target != null && (
                  <div style={{ height: 6, background: "var(--ch-surface-3)", borderRadius: 3, overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: pct >= 80 ? "var(--ch-success)" : "var(--ch-persona)",
                        borderRadius: 3,
                        transition: "width 0.3s var(--ch-ease)",
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

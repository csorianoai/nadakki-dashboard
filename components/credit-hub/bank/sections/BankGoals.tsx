"use client";

import { GoalCard } from "@/components/credit-hub/elite/GoalCard";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import type { BankDashboardAnalytics } from "@/lib/credit-hub/types/bankDecision";
import { chMoney } from "@/lib/credit-hub/ch-base";

export function BankGoals({ analytics, queueCount }: { analytics?: BankDashboardAnalytics; queueCount: number }) {
  const approvalPct = analytics ? Math.round(analytics.approval_rate * 100) : 0;
  const avgHours = analytics?.avg_decision_time_hours ?? null;
  const placed = analytics?.portfolio_value ?? 0;
  const approvedCount = analytics ? Math.round(analytics.total_applications * analytics.approval_rate) : 0;

  const goals = [
    {
      title: "Monto colocado",
      currentDisplay: placed ? chMoney(placed) : "—",
      targetDisplay: chMoney(120_000_000),
      pct: placed ? Math.min(Math.round((placed / 120_000_000) * 100), 100) : 0,
      status: placed >= 90_000_000 ? ("en camino" as const) : ("atrasado" as const),
      projectionLine: "Proy. fin de mes · 91% de meta",
    },
    {
      title: "Créditos aprobados",
      currentDisplay: String(approvedCount),
      targetDisplay: "120",
      pct: Math.min(Math.round((approvedCount / 120) * 100), 100),
      status: approvedCount >= 90 ? ("en camino" as const) : ("atrasado" as const),
      projectionLine: "Proy. fin de mes · 88% de meta",
    },
    {
      title: "Tasa de aprobación",
      currentDisplay: `${approvalPct}%`,
      targetDisplay: "≥75%",
      pct: approvalPct >= 75 ? 100 : Math.round((approvalPct / 75) * 100),
      status: approvalPct >= 75 ? ("cumplido" as const) : ("en camino" as const),
      projectionLine: `Proy. fin de mes · ${Math.max(approvalPct - 2, 0)}%`,
    },
    {
      title: "Tiempo de respuesta",
      currentDisplay: avgHours != null ? `${Math.round(avgHours)}h` : "—",
      targetDisplay: "≤6h",
      pct: avgHours != null && avgHours <= 6 ? 100 : avgHours != null ? Math.max(0, 100 - Math.round((avgHours - 6) * 10)) : 0,
      status: avgHours != null && avgHours <= 6 ? ("cumplido" as const) : ("atrasado" as const),
      projectionLine: queueCount === 0 ? "Cola vacía · holgado" : "Proy. fin de mes · revisar SLA",
    },
  ];

  return (
    <section data-testid="bank-monthly-goals" className="mb-[26px]">
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <span className="ch-eyebrow">Metas</span>
        <h2 className="ch-serif" style={{ margin: 0, fontSize: 19 }}>
          Metas operativas del mes
        </h2>
        <DataTruthBadge level="DEMO" />
        <span className="ch-chip" style={{ fontSize: 10 }}>8 días restantes</span>
      </div>
      <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--ch-text-3)" }}>
        Pacing vs. objetivos institucionales · valores actuales REAL desde analytics
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {goals.map((g) => (
          <GoalCard key={g.title} {...g} />
        ))}
      </div>
    </section>
  );
}

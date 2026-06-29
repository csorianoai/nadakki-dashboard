"use client";

import type { CreditApplication, CreditStats } from "@/lib/credit-hub/types/creditCore";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import { GoalCard } from "@/components/credit-hub/elite/GoalCard";
import { formatDealerMoney, volumeThisMonth } from "@/lib/credit-hub/dealer/dealerFormat";

export function DealerGoals({ stats, applications, currency }: { stats?: CreditStats; applications: CreditApplication[]; currency: string }) {
  const monthVolume = volumeThisMonth(applications, currency);
  const approvalPct = stats?.approval_rate != null ? Math.round(stats.approval_rate * 100) : 0;
  const funded = applications.filter((a) => ["processed", "completed"].includes(a.status)).length;
  const submitted = stats?.submitted_applications ?? 0;
  const lookToBook = submitted > 0 ? Math.round((funded / submitted) * 100) : 0;

  const goals = [
    {
      title: "Unidades financiadas",
      currentDisplay: String(funded),
      targetDisplay: "55",
      pct: Math.min(Math.round((funded / 55) * 100), 100),
      status: funded >= 38 ? ("en camino" as const) : ("atrasado" as const),
      projectionLine: "Proy. fin de mes · 95% de meta",
    },
    {
      title: "Volumen financiado",
      currentDisplay: monthVolume,
      targetDisplay: formatDealerMoney(70000000, currency),
      pct: 67,
      status: "atrasado" as const,
      projectionLine: "Proy. fin de mes · 91% de meta",
    },
    {
      title: "Tasa de aprobación",
      currentDisplay: `${approvalPct}%`,
      targetDisplay: "≥62%",
      pct: approvalPct >= 62 ? 100 : Math.round((approvalPct / 62) * 100),
      status: approvalPct >= 62 ? ("cumplido" as const) : ("en camino" as const),
      projectionLine: `Proy. fin de mes · ${Math.max(approvalPct - 1, 0)}%`,
    },
    {
      title: "Look-to-book",
      currentDisplay: `${lookToBook}%`,
      targetDisplay: "≥30%",
      pct: lookToBook >= 30 ? 100 : Math.round((lookToBook / 30) * 100),
      status: lookToBook >= 30 ? ("cumplido" as const) : ("en camino" as const),
      projectionLine: `Proy. fin de mes · ${lookToBook + 1}%`,
    },
  ];

  const monthLabel = new Date().toLocaleDateString("es-DO", { month: "long", year: "numeric" });

  return (
    <section data-testid="dealer-monthly-goals" className="mb-[26px]">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <h2 className="ch-serif" style={{ margin: 0, fontSize: 19 }}>
          Metas del mes
        </h2>
        <DataTruthBadge level="DEMO" />
        <span style={{ fontSize: 12, color: "var(--ch-text-3)" }}>Objetivos del dealer · {monthLabel}</span>
        <span className="ch-chip" style={{ fontSize: 10 }}>8 días restantes</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {goals.map((g) => (
          <GoalCard key={g.title} {...g} />
        ))}
      </div>
    </section>
  );
}

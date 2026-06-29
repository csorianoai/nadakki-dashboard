"use client";

import type { CreditApplication, CreditStats } from "@/lib/credit-hub/types/creditCore";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import { formatDealerMoney, volumeThisMonth } from "@/lib/credit-hub/dealer/dealerFormat";

type GoalStatus = "en camino" | "atrasado" | "cumplido";

function statusChip(status: GoalStatus) {
  const styles = {
    "en camino": { bg: "var(--ch-warning-soft)", c: "var(--ch-warning-text)" },
    atrasado: { bg: "var(--ch-danger-soft)", c: "var(--ch-danger-text)" },
    cumplido: { bg: "var(--ch-success-soft)", c: "var(--ch-success-text)" },
  }[status];
  return (
    <span className="ch-chip" style={{ fontSize: 10, background: styles.bg, color: styles.c, textTransform: "lowercase" }}>
      {status}
    </span>
  );
}

export function DealerGoals({ stats, applications, currency }: { stats?: CreditStats; applications: CreditApplication[]; currency: string }) {
  const monthVolume = volumeThisMonth(applications, currency);
  const approvalPct = stats?.approval_rate != null ? Math.round(stats.approval_rate * 100) : 0;
  const funded = applications.filter((a) => ["processed", "completed"].includes(a.status)).length;
  const submitted = stats?.submitted_applications ?? 0;
  const lookToBook = submitted > 0 ? Math.round((funded / submitted) * 100) : 0;

  const goals = [
    {
      title: "Unidades financiadas",
      current: funded,
      target: 55,
      status: (funded >= 38 ? "en camino" : "atrasado") as GoalStatus,
      projection: Math.round(funded * 1.35),
      projPct: 95,
    },
    {
      title: "Volumen financiado",
      currentLabel: monthVolume,
      targetLabel: formatDealerMoney(70000000, currency),
      pct: 67,
      status: "atrasado" as GoalStatus,
      projection: formatDealerMoney(64000000, currency),
      projPct: 91,
    },
    {
      title: "Tasa de aprobación",
      currentLabel: `${approvalPct}%`,
      targetLabel: "≥62%",
      pct: approvalPct >= 62 ? 100 : Math.round((approvalPct / 62) * 100),
      status: (approvalPct >= 62 ? "cumplido" : "en camino") as GoalStatus,
      projection: `${Math.max(approvalPct - 1, 0)}%`,
      projPct: 106,
    },
    {
      title: "Look-to-book",
      currentLabel: `${lookToBook}%`,
      targetLabel: "≥30%",
      pct: lookToBook >= 30 ? 100 : Math.round((lookToBook / 30) * 100),
      status: (lookToBook >= 30 ? "cumplido" : "en camino") as GoalStatus,
      projection: `${lookToBook + 1}%`,
      projPct: 117,
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
          <div key={g.title} className="ch-card" style={{ padding: 14 }}>
            <div className="flex justify-between items-start gap-2 mb-2">
              <div style={{ fontSize: 13, fontWeight: 600 }}>{g.title}</div>
              {statusChip(g.status)}
            </div>
            <div className="ch-mono" style={{ fontSize: 20, fontWeight: 700 }}>
              {"currentLabel" in g ? g.currentLabel : g.current}
              <span style={{ fontSize: 13, color: "var(--ch-text-3)", fontWeight: 500 }}>
                {" "}/ meta {"targetLabel" in g ? g.targetLabel : g.target}
              </span>
            </div>
            <div style={{ height: 6, background: "var(--ch-surface-3)", borderRadius: 3, margin: "10px 0 6px", overflow: "hidden" }}>
              <div
                style={{
                  width: `${Math.min(g.pct, 100)}%`,
                  height: "100%",
                  background: g.status === "cumplido" ? "var(--ch-success)" : g.status === "atrasado" ? "var(--ch-danger)" : "var(--ch-warning)",
                }}
              />
            </div>
            <div style={{ fontSize: 11, color: "var(--ch-text-3)" }}>
              {g.pct}% avance · Proy: {g.projection} ({g.projPct}% de meta)
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

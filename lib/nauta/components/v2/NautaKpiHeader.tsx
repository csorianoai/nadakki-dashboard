"use client";

import { useEffect, useState } from "react";
import type { NautaDashboardSummary } from "@/lib/nauta/types";
import { formatDopCompact, formatNumber, juniorAnalystsFromHours, usdToDop } from "@/lib/nauta/format";
import { S } from "@/lib/nauta/strings";
import { KpiCard } from "./KpiCard";

export function NautaKpiHeader({ summary }: { summary: NautaDashboardSummary }) {
  const [hours, setHours] = useState(summary.hours_saved);

  useEffect(() => {
    setHours(summary.hours_saved);
  }, [summary.hours_saved]);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (Math.random() > 0.55) {
        setHours((h) => h + 1);
      }
    }, 3200);
    return () => window.clearInterval(id);
  }, []);

  const perEmployee = formatDopCompact(usdToDop(summary.cost_usd_month / 16));
  const analysts = juniorAnalystsFromHours(hours);

  return (
    <section className="kpis" aria-label="Indicadores">
      <KpiCard
        variant="hero"
        label={S.kpi.hoursSaved}
        value={formatNumber(hours)}
        pulse
        sparkWidth={82}
        delta={
          <>
            ≈ <span className="hero-sub-accent">{analysts} analistas junior</span>
          </>
        }
      />
      <KpiCard
        label={S.kpi.successRate}
        value={summary.success_rate.toFixed(1)}
        unit="%"
        sparkWidth={99}
        delta={<span className="up">{S.kpi.successDelta}</span>}
      />
      <KpiCard
        label={S.kpi.runsMonth}
        value={formatNumber(summary.total_runs)}
        sparkWidth={74}
        delta={<span className="up">{S.kpi.runsDelta}</span>}
      />
      <KpiCard
        label={S.kpi.payrollCost}
        value={formatDopCompact(usdToDop(summary.cost_usd_month))}
        sparkWidth={34}
        delta={S.kpi.payrollPerEmployee(perEmployee)}
      />
      <KpiCard
        variant="warn"
        label={S.kpi.pendingApprovals}
        value={summary.pending_approvals}
        sparkWidth={24}
        sparkColor="warn"
        delta={
          <>
            <span className="dn">◔</span> {S.kpi.pendingHint}
          </>
        }
      />
    </section>
  );
}

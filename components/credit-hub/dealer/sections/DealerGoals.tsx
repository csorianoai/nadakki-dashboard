"use client";

import { GoalCard } from "@/components/credit-hub/elite/GoalCard";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import { CHPanelState } from "@/components/credit-hub/system/CHPanelState";
import { currentGoalsPeriod } from "@/lib/credit-hub/api/goalsClient";
import { useMonthlyGoals } from "@/lib/credit-hub/hooks/useMonthlyGoals";
import {
  daysRemainingInMonth,
  formatGoalsMonthLabel,
  presentMonthlyGoal,
} from "@/lib/credit-hub/utils/goalPresentation";

export function DealerGoals({ currency }: { currency: string }) {
  const period = currentGoalsPeriod();
  const query = useMonthlyGoals("dealer", period);
  const goals = query.data?.goals ?? [];
  const monthLabel = formatGoalsMonthLabel(query.data?.period ?? period);
  const daysLeft = daysRemainingInMonth();

  return (
    <section data-testid="dealer-monthly-goals" className="mb-[26px]">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <h2 className="ch-serif" style={{ margin: 0, fontSize: 19 }}>
          Metas del mes
        </h2>
        <DataTruthBadge level={query.isError ? "ROADMAP" : "REAL"} />
        <span style={{ fontSize: 12, color: "var(--ch-text-3)" }}>Objetivos del dealer · {monthLabel}</span>
        <span className="ch-chip" style={{ fontSize: 10 }}>
          {daysLeft} días restantes
        </span>
      </div>
      <CHPanelState
        isLoading={query.isLoading}
        isError={query.isError}
        onRetry={() => void query.refetch()}
        errorTitle="Metas del mes no disponibles"
        loadingLabel="Cargando metas del mes…"
        isUnavailable={!query.isLoading && !query.isError && goals.length === 0}
        unavailableTitle="Sin metas configuradas"
        unavailableDescription="No hay metas para este periodo en el tenant activo."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {goals.map((g) => {
            const card = presentMonthlyGoal(g, currency, query.data?.period ?? period);
            return <GoalCard key={g.metric_key} {...card} />;
          })}
        </div>
      </CHPanelState>
    </section>
  );
}

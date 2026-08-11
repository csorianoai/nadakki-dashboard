"use client";

import { GoalCard } from "@/components/credit-hub/elite/GoalCard";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import { CHPanelState } from "@/components/credit-hub/system/CHPanelState";
import { currentGoalsPeriod } from "@/lib/credit-hub/api/goalsClient";
import { isChPanelLoading } from "@/lib/credit-hub/hooks/chQueryPanel";
import { useMonthlyGoals } from "@/lib/credit-hub/hooks/useMonthlyGoals";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";
import {
  daysRemainingInMonth,
  formatGoalsMonthLabel,
  presentMonthlyGoal,
} from "@/lib/credit-hub/utils/goalPresentation";

export function BankGoals() {
  const { apiTenantId } = useTenant();
  const period = currentGoalsPeriod();
  const query = useMonthlyGoals("bank", period);
  const goals = query.data?.goals ?? [];
  const goalsLoading = isChPanelLoading(query, !!apiTenantId);
  const monthLabel = formatGoalsMonthLabel(query.data?.period ?? period);
  const daysLeft = daysRemainingInMonth();

  return (
    <section data-testid="bank-monthly-goals" className="mb-[26px]">
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <span className="ch-eyebrow">Metas</span>
        <h2 className="ch-serif" style={{ margin: 0, fontSize: 19 }}>
          Metas operativas del mes
        </h2>
        <DataTruthBadge level={query.isError ? "ROADMAP" : "REAL"} />
        <span className="ch-chip" style={{ fontSize: 10 }}>
          {daysLeft} días restantes
        </span>
      </div>
      <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--ch-text-3)" }}>
        Pacing vs. objetivos institucionales · {monthLabel}
      </p>
      <CHPanelState
        isLoading={goalsLoading}
        isError={query.isError}
        onRetry={() => void query.refetch()}
        errorTitle="Metas operativas no disponibles"
        loadingLabel="Cargando metas operativas…"
        isUnavailable={!goalsLoading && !query.isError && goals.length === 0}
        unavailableTitle="Sin metas configuradas"
        unavailableDescription="No hay metas bancarias para este periodo en el tenant activo."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {goals.map((g) => {
            const card = presentMonthlyGoal(g, "DOP", query.data?.period ?? period);
            return <GoalCard key={g.metric_key} {...card} />;
          })}
        </div>
      </CHPanelState>
    </section>
  );
}

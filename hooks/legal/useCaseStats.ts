"use client";

import { useMemo } from "react";
import type { LegalCase } from "@/lib/legal/cases/case-types";
import { daysUntil } from "@/lib/legal/cases/deadline-formatter";

export interface LegalCaseWorkbenchStats {
  total: number;
  activeFlow: number;
  deadlinesDueThisWeek: number;
  healthIndexPercent: number;
}

/** Agrega KPIs locales del conjunto cargado para la cinta estadística del tablero. */
export function useCaseStats(cases: LegalCase[]): LegalCaseWorkbenchStats {
  return useMemo(() => {
    const total = cases.length;
    const activeFlow = cases.filter((c) => c.state !== "CLOSED" && c.state !== "ARCHIVED").length;

    let deadlinesDueThisWeek = 0;
    for (const c of cases) {
      for (const d of c.deadlines ?? []) {
        if (d.status !== "active") continue;
        const days = daysUntil(d.effective_deadline_date);
        if (days >= 0 && days <= 7) deadlinesDueThisWeek += 1;
      }
    }

    const withoutAlerts = cases.filter(
      (c) => c.open_issues_count === 0 && !c.has_expired_critical_deadline_at_ingestion
    ).length;
    const healthIndexPercent = total === 0 ? 100 : Math.round((withoutAlerts / total) * 100);

    return {
      total,
      activeFlow,
      deadlinesDueThisWeek,
      healthIndexPercent,
    };
  }, [cases]);
}

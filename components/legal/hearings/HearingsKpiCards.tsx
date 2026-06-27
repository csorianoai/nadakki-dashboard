"use client";

import { CalendarClock, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import type { HearingKPIs } from "@/lib/legal/hearings/hearings-types";
import { formatHearingDate } from "@/lib/legal/hearings/hearings-format";

/**
 * KPI cards using the REAL fields of HearingKPIs:
 *   upcoming_7d · overdue · completed_30d · cancelled_30d · next_hearing · demo_data.
 * There is no "total" nor "compliance rate" in the contract — none are invented.
 */
type CardDef = {
  key: keyof Pick<HearingKPIs, "upcoming_7d" | "overdue" | "completed_30d" | "cancelled_30d">;
  label: string;
  icon: typeof CalendarClock;
  accent: string;
};

const CARDS: CardDef[] = [
  { key: "upcoming_7d", label: "Próximas (7 días)", icon: CalendarClock, accent: "text-sky-300" },
  { key: "overdue", label: "Vencidas", icon: AlertTriangle, accent: "text-amber-300" },
  { key: "completed_30d", label: "Completadas (30 días)", icon: CheckCircle2, accent: "text-emerald-300" },
  { key: "cancelled_30d", label: "Canceladas (30 días)", icon: XCircle, accent: "text-red-300" },
];

export function HearingsKpiCards({ kpis }: { kpis: HearingKPIs }) {
  return (
    <section aria-label="Indicadores de audiencias" className="space-y-3">
      {kpis.demo_data ? (
        <div
          className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200"
          role="status"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            Datos de demostración: el backend devolvió indicadores de ejemplo, no datos reales del
            tenant.
          </span>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {CARDS.map(({ key, label, icon: Icon, accent }) => (
          <div
            key={key}
            className="rounded-xl border border-zinc-800/70 bg-zinc-900/40 p-4"
            data-kpi={key}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
              <Icon className={`h-4 w-4 ${accent}`} aria-hidden="true" />
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-100">
              {kpis[key] ?? 0}
            </p>
          </div>
        ))}
      </div>

      {kpis.next_hearing ? (
        <p className="text-sm text-zinc-400" data-testid="next-hearing">
          Próxima audiencia:{" "}
          <span className="font-medium text-zinc-200">{kpis.next_hearing.title}</span>{" "}
          ·{" "}
          {formatHearingDate(kpis.next_hearing.hearing_date, kpis.next_hearing.timezone)}
        </p>
      ) : null}
    </section>
  );
}

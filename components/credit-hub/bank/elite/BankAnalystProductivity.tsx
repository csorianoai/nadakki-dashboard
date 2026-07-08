"use client";

import { AreaChart } from "@/components/credit-hub/bank/shared/bankUi";
import { EmptyStateRich } from "@/components/credit-hub/primitives";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import type { BankDashboardAnalytics } from "@/lib/credit-hub/types/bankDecision";

export function BankAnalystProductivity({ analytics }: { analytics?: BankDashboardAnalytics }) {
  const cohort = analytics?.cohort_analysis ?? [];
  const volumeTrend = cohort.map((c) => c.applications);
  const approvalTrend = cohort.map((c) => +(c.approval_rate * 100).toFixed(1));
  const labels = cohort.map((c) => c.period.slice(5));
  const hasCohort = volumeTrend.length > 0;

  return (
    <section data-testid="bank-analyst-productivity" className="mb-[26px]">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="ch-eyebrow">Productividad</span>
        <h2 className="ch-serif" style={{ margin: 0, fontSize: 19 }}>
          Analistas y tendencias del mes
        </h2>
        <DataTruthBadge level={hasCohort ? "REAL" : "ROADMAP"} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-3 mb-3">
        <div className="ch-card overflow-hidden">
          <div className="ch-card-h">
            <div className="ch-card-title">Carga por analista</div>
            <DataTruthBadge level="ROADMAP" />
          </div>
          <div style={{ padding: "16px" }}>
            <EmptyStateRich
              variant="placeholder"
              title="Próximamente"
              description="Productividad por analista requiere endpoint dedicado — no mostramos filas ilustrativas."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="ch-card overflow-hidden">
            <div className="ch-card-h">
              <div>
                <div className="ch-card-title">Volumen diario</div>
                <div className="ch-card-sub">Serie por cohorte</div>
              </div>
              <DataTruthBadge level={hasCohort ? "REAL" : "ROADMAP"} />
            </div>
            <div className="p-4">
              {hasCohort ? (
                <AreaChart
                  data={volumeTrend}
                  labels={labels.length ? labels : undefined}
                  color="var(--ch-bank-accent, var(--ch-persona))"
                />
              ) : (
                <EmptyStateRich
                  variant="empty"
                  title="Sin cohortes"
                  description="El dashboard de analytics no devolvió cohort_analysis para este periodo."
                />
              )}
            </div>
          </div>
          <div className="ch-card overflow-hidden">
            <div className="ch-card-h">
              <div>
                <div className="ch-card-title">Cumplimiento SLA</div>
                <div className="ch-card-sub">% dentro de meta 6 h</div>
              </div>
              <DataTruthBadge level="ROADMAP" />
            </div>
            <div className="p-4">
              <EmptyStateRich
                variant="placeholder"
                title="Próximamente"
                description="Serie SLA por analista pendiente de endpoint."
              />
            </div>
          </div>
        </div>
      </div>

      <div className="ch-card overflow-hidden">
        <div className="ch-card-h">
          <div>
            <div className="ch-card-title">Tasa de aprobación</div>
            <div className="ch-card-sub">Tendencia mensual</div>
          </div>
          <DataTruthBadge level={hasCohort ? "REAL" : "ROADMAP"} />
        </div>
        <div className="p-4">
          {hasCohort ? (
            <AreaChart
              data={approvalTrend}
              color="var(--ch-success)"
              labels={labels.length ? labels : undefined}
              fmtY={(v) => `${v.toFixed(0)}%`}
            />
          ) : (
            <EmptyStateRich
              variant="empty"
              title="Sin tendencia"
              description="Más solicitudes generarán cohortes en analytics/dashboard."
            />
          )}
        </div>
      </div>
    </section>
  );
}

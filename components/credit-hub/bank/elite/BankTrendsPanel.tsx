"use client";

import { EmptyStateRich } from "@/components/credit-hub/primitives";
import { AreaChart } from "@/components/credit-hub/bank/shared/bankUi";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import type { BankDashboardAnalytics } from "@/lib/credit-hub/types/bankDecision";

export function BankTrendsPanel({ analytics }: { analytics?: BankDashboardAnalytics }) {
  const cohort = analytics?.cohort_analysis ?? [];
  const approvalTrend = cohort.map((c) => +(c.approval_rate * 100).toFixed(1));
  const volumeTrend = cohort.map((c) => c.applications);
  const labels = cohort.map((c) => c.period.slice(5));

  return (
    <section data-testid="bank-trends-panel" className="mb-[26px]">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="ch-eyebrow">Tendencias</span>
        <h2 className="ch-serif" style={{ margin: 0, fontSize: 19 }}>
          Operación por cohortes
        </h2>
        <DataTruthBadge level={analytics ? "REAL" : "ROADMAP"} />
      </div>
      <p style={{ margin: "0 0 14px", fontSize: 13, color: "var(--ch-text-3)" }}>
        Derivado del motor — solo tu institución
      </p>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="ch-card overflow-hidden">
          <div className="ch-card-h">
            <div>
              <div className="ch-card-title">Volumen</div>
              <div className="ch-card-sub">Solicitudes por periodo</div>
            </div>
          </div>
          <div className="p-4">
            {volumeTrend.length ? (
              <AreaChart data={volumeTrend} labels={labels} color="var(--ch-bank-accent, var(--ch-persona))" />
            ) : (
              <EmptyStateRich variant="placeholder" title="Sin serie" body="Más solicitudes generarán cohortes." />
            )}
          </div>
        </div>
        <div className="ch-card overflow-hidden">
          <div className="ch-card-h">
            <div>
              <div className="ch-card-title">Tasa de aprobación</div>
              <div className="ch-card-sub">% aprobación por cohorte</div>
            </div>
          </div>
          <div className="p-4">
            {approvalTrend.length ? (
              <AreaChart
                data={approvalTrend}
                color="var(--ch-success)"
                labels={labels}
                fmtY={(v) => `${v.toFixed(0)}%`}
              />
            ) : (
              <EmptyStateRich variant="placeholder" title="Sin cohortes" body="Más solicitudes generarán cohortes." />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useMemo } from "react";
import { AreaChart } from "@/components/credit-hub/bank/shared/bankUi";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import type { BankDashboardAnalytics } from "@/lib/credit-hub/types/bankDecision";

const DEMO_ANALYSTS = [
  { name: "Ana M.", decisions: 24, avgHours: 4.2, load: 78 },
  { name: "Carlos R.", decisions: 18, avgHours: 5.1, load: 62 },
  { name: "Sin asignar", decisions: 6, avgHours: 0, load: 35 },
];

export function BankAnalystProductivity({ analytics }: { analytics?: BankDashboardAnalytics }) {
  const cohort = analytics?.cohort_analysis ?? [];
  const volumeTrend = cohort.map((c) => c.applications);
  const approvalTrend = cohort.map((c) => +(c.approval_rate * 100).toFixed(1));
  const labels = cohort.map((c) => c.period.slice(5));
  const slaSeries = useMemo(() => [88, 90, 87, 92, 91, 89, 93], []);

  return (
    <section data-testid="bank-analyst-productivity" className="mb-[26px]">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="ch-eyebrow">Productividad</span>
        <h2 className="ch-serif" style={{ margin: 0, fontSize: 19 }}>
          Analistas y tendencias del mes
        </h2>
        <DataTruthBadge level="DEMO" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-3 mb-3">
        <div className="ch-card overflow-hidden">
          <div className="ch-card-h">
            <div className="ch-card-title">Carga por analista</div>
          </div>
          <div style={{ padding: "12px 16px" }}>
            {DEMO_ANALYSTS.map((a) => (
              <div key={a.name} className="ch-field-row">
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{a.name}</div>
                  <div style={{ fontSize: 11, color: "var(--ch-text-3)" }}>
                    {a.decisions} decisiones · {a.avgHours ? `${a.avgHours}h prom.` : "pendiente"}
                  </div>
                </div>
                <div style={{ width: 80, textAlign: "right" }}>
                  <div className="ch-mono" style={{ fontSize: 12, fontWeight: 700 }}>
                    {a.load}%
                  </div>
                  <div style={{ height: 4, background: "var(--ch-surface-3)", borderRadius: 2, marginTop: 4 }}>
                    <div
                      style={{
                        width: `${a.load}%`,
                        height: "100%",
                        background: a.load > 75 ? "var(--ch-warning)" : "var(--ch-bank-accent, var(--ch-persona))",
                        borderRadius: 2,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="ch-card overflow-hidden">
            <div className="ch-card-h">
              <div>
                <div className="ch-card-title">Volumen diario</div>
                <div className="ch-card-sub">Serie por cohorte</div>
              </div>
              <DataTruthBadge level={volumeTrend.length ? "REAL" : "DEMO"} />
            </div>
            <div className="p-4">
              <AreaChart
                data={volumeTrend.length ? volumeTrend : [12, 14, 11, 16, 15, 18, 17]}
                labels={labels.length ? labels : undefined}
                color="var(--ch-bank-accent, var(--ch-persona))"
              />
            </div>
          </div>
          <div className="ch-card overflow-hidden">
            <div className="ch-card-h">
              <div>
                <div className="ch-card-title">Cumplimiento SLA</div>
                <div className="ch-card-sub">% dentro de meta 6 h</div>
              </div>
              <DataTruthBadge level="DEMO" />
            </div>
            <div className="p-4">
              <AreaChart data={slaSeries} color="var(--ch-success)" fmtY={(v) => `${v.toFixed(0)}%`} />
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
          <DataTruthBadge level={approvalTrend.length ? "REAL" : "DEMO"} />
        </div>
        <div className="p-4">
          <AreaChart
            data={approvalTrend.length ? approvalTrend : [68, 69, 67, 71, 70, 72, 71]}
            color="var(--ch-success)"
            labels={labels.length ? labels : undefined}
            fmtY={(v) => `${v.toFixed(0)}%`}
          />
        </div>
      </div>
    </section>
  );
}

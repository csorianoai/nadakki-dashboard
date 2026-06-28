"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { EmptyStateRich, KpiStripSkeleton } from "@/components/credit-hub/primitives";
import { CohortChart, KpiCardTrend, SectionHeader } from "@/components/credit-hub/bank/shared/bankUi";
import { PortfolioHealthGrid } from "@/components/credit-hub/bank/sections/PortfolioHealthGrid";
import { chMoney } from "@/lib/credit-hub/ch-base";
import type { BankAnalyticsViewProps } from "@/lib/credit-hub/types/bank-views";
import { formatDefaultPredictionDisplay, classifyDefaultPredictionTrust } from "@/lib/credit-hub/bank/bankFormat";
import { BankSegment } from "@/components/credit-hub/bank/shared/bankUi";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";

const MEDAL = ["#C9A227", "#9CA3AF", "#B07A45"];

export function BankAnalyticsView({ analytics, portfolioHealth, dealers, isLoading, isError, onRetry }: BankAnalyticsViewProps) {
  const [period, setPeriod] = useState("30d");
  const a = analytics;
  const ranking = dealers ?? a?.top_dealers ?? [];

  if (isLoading) return <KpiStripSkeleton n={4} />;
  if (isError || !a) return <EmptyStateRich variant="error" primary={<button type="button" className="ch-btn ch-btn-secondary" onClick={onRetry}>Reintentar</button>} />;

  const defaultDisplay = formatDefaultPredictionDisplay(
    a.default_prediction.predicted_default_rate,
    a.default_prediction.predicted_default_count,
    a.total_applications,
  );
  const defaultTrust = classifyDefaultPredictionTrust(
    defaultDisplay,
    a.default_prediction.predicted_default_count,
    a.total_applications,
  );

  return (
    <div data-testid="bank-analytics-executive">
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 22, gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span className="ch-eyebrow">Analytics & Intelligence Executive</span>
            <DataTruthBadge level="REAL" />
          </div>
          <h1 className="ch-serif" style={{ margin: 0, fontSize: 33, letterSpacing: "-0.02em" }}>
            Cartera ejecutiva
          </h1>
          <div style={{ fontSize: 13.5, color: "var(--ch-text-3)", marginTop: 6 }}>
            {a.total_applications} solicitudes · motor {a.default_prediction.rule}
          </div>
        </div>
        <BankSegment value={period} onChange={setPeriod} options={[{ v: "7d", l: "7 días" }, { v: "30d", l: "30 días" }, { v: "90d", l: "90 días" }, { v: "ytd", l: "YTD" }]} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 26 }}>
        <KpiCardTrend label="Volumen aprobado" value={chMoney(a.portfolio_value).replace("MX$", "")} unit="MX$" trend={null} trendLabel="cartera viva" accent />
        <KpiCardTrend label="Tasa de aprobación" value={(a.approval_rate * 100).toFixed(0)} unit="%" trend={null} trendLabel="periodo seleccionado" />
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", top: 10, right: 10, zIndex: 2, display: "flex", gap: 6, alignItems: "center" }}>
            <DataTruthBadge level={defaultTrust.level} />
            {defaultDisplay.isExtreme ? (
              <span
                className="ch-chip danger"
                title={defaultDisplay.extremeTooltip}
                style={{ cursor: "help", fontSize: 10 }}
              >
                Extremo
              </span>
            ) : null}
          </div>
          <KpiCardTrend
            label="Default predicho"
            value={defaultDisplay.percentLabel}
            unit="%"
            trend={null}
            trendLabel={`${a.default_prediction.predicted_default_count} casos estimados · ${defaultTrust.contextNote}`}
          />
        </div>
        <KpiCardTrend label="Tiempo prom. decisión" value={a.avg_decision_time_hours ?? "—"} unit={a.avg_decision_time_hours != null ? "h" : undefined} trend={null} trendLabel="meta ≤ 6 h" />
      </div>

      <SectionHeader eyebrow="Cohortes" title="Solicitudes y tasa de aprobación" sub="Barras: solicitudes · línea: tasa" />
      <div className="ch-card" style={{ padding: 18, marginBottom: 14 }}>
        <CohortChart cohort={a.cohort_analysis} />
      </div>

      <div className="ch-card" style={{ overflow: "hidden", marginBottom: 26 }}>
        <table className="ch-table">
          <thead>
            <tr>
              <th>Periodo</th>
              <th className="ch-num">Solicitudes</th>
              <th className="ch-num">Aprobadas</th>
              <th className="ch-num">Tasa</th>
              <th>Tendencia</th>
            </tr>
          </thead>
          <tbody>
            {a.cohort_analysis.map((c, i) => {
              const prev = a.cohort_analysis[i - 1];
              const up = prev ? c.approval_rate >= prev.approval_rate : true;
              return (
                <tr key={c.period}>
                  <td className="ch-mono" style={{ fontWeight: 600 }}>
                    {c.period}
                  </td>
                  <td className="ch-num">{c.applications}</td>
                  <td className="ch-num">{c.approved}</td>
                  <td className="ch-num" style={{ fontWeight: 600 }}>
                    {(c.approval_rate * 100).toFixed(1)}%
                  </td>
                  <td>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: up ? "var(--ch-success)" : "var(--ch-danger)" }}>
                      {up ? <ArrowUp className="h-3 w-3" aria-hidden /> : <ArrowDown className="h-3 w-3" aria-hidden />}
                      {prev ? `${Math.abs((c.approval_rate - prev.approval_rate) * 100).toFixed(1)} pp` : "—"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 14, alignItems: "start" }}>
        <div>
          <SectionHeader eyebrow="Red de concesionarios" title="Top dealers" />
          <div className="ch-card" style={{ overflow: "hidden" }}>
            <table className="ch-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th>Concesionario</th>
                  <th className="ch-num">Volumen</th>
                  <th className="ch-num">Aprobadas</th>
                  <th className="ch-num">Tasa</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((d, i) => (
                  <tr key={d.dealer}>
                    <td>
                      {i < 3 ? (
                        <span style={{ width: 20, height: 20, borderRadius: 999, display: "inline-flex", alignItems: "center", justifyContent: "center", background: MEDAL[i], color: "#fff", fontSize: 10, fontWeight: 700 }}>
                          {i + 1}
                        </span>
                      ) : (
                        <span className="ch-mono" style={{ color: "var(--ch-text-3)", paddingLeft: 5 }}>
                          {i + 1}
                        </span>
                      )}
                    </td>
                    <td style={{ fontWeight: 600 }}>{d.dealer}</td>
                    <td className="ch-num">{chMoney(d.volume)}</td>
                    <td className="ch-num">{d.approved}</td>
                    <td className="ch-num">
                      <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                        <div style={{ width: 56, height: 5, background: "var(--ch-surface-3)", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ width: `${d.approval_rate * 100}%`, height: "100%", background: "var(--ch-accent-mid)" }} />
                        </div>
                        <span style={{ fontWeight: 600 }}>{(d.approval_rate * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <PortfolioHealthGrid distribution={portfolioHealth?.score_distribution} />
      </div>
    </div>
  );
}

"use client";

import { Component, type ErrorInfo, type ReactNode, useMemo, useState } from "react";
import { ApprovalRateByBucket, ApprovalRateSkeleton } from "@/components/credit/dealer/analytics/ApprovalRateByBucket";
import { ConversionFunnel, ConversionFunnelSkeleton } from "@/components/credit/dealer/analytics/ConversionFunnel";
import { PerformanceMetricsCards } from "@/components/credit/dealer/analytics/PerformanceMetricsCards";
import { PeriodSelector } from "@/components/credit/dealer/analytics/PeriodSelector";
import { TimeToCloseChart, TimeToCloseSkeleton } from "@/components/credit/dealer/analytics/TimeToCloseChart";
import { useDealerAnalytics } from "@/hooks/useDealerAnalytics";
import { downloadExportedBlob, exportAnalyticsCSV } from "@/lib/dealer/analytics-api";
import type { AnalyticsPeriod, DealerAnalytics } from "@/types/dealer-analytics";

function emptyFunnel(): DealerAnalytics["conversionFunnel"] {
  return {
    started: 0,
    submitted: 0,
    approved: 0,
    closed: 0,
    dropOffPercents: [],
  };
}

function emptyTimeToClose(): DealerAnalytics["timeToClose"] {
  return {
    weeklyAverages: [],
    currentAvg: 0,
    trend: "stable",
  };
}

function emptyApprovalBuckets(): DealerAnalytics["approvalRateByBucket"] {
  return { byAmount: [], byTerm: [], byRiskTier: [] };
}

class DealerAnalyticsErrorBoundary extends Component<{ children: ReactNode; slug: string }, { error: Error | null }> {
  constructor(props: { children: ReactNode; slug: string }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(): void {}

  render() {
    if (this.state.error) {
      return (
        <div
          className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200"
          role="alert"
          data-testid={`dealer-section-error-${this.props.slug}`}
        >
          <p className="font-semibold">No se pudo renderizar esta sección.</p>
          <p className="mt-1 text-red-300/95">{this.state.error.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

function isEffectivelyEmpty(d: DealerAnalytics): boolean {
  const m = d.performanceMetrics;
  const noFlow =
    d.conversionFunnel.started + d.conversionFunnel.submitted + d.conversionFunnel.approved + d.conversionFunnel.closed ===
    0;
  const metricsZero = m.avgDealSize === 0 && m.totalVolume === 0 && m.approvalRate === 0 && m.npsScore === 0;
  const noWeekly = d.timeToClose.weeklyAverages.length === 0;
  const noBuckets =
    d.approvalRateByBucket.byAmount.length === 0 &&
    d.approvalRateByBucket.byTerm.length === 0 &&
    d.approvalRateByBucket.byRiskTier.length === 0;
  return metricsZero && noFlow && noWeekly && noBuckets;
}

interface DealerDashboardProps {
  period: AnalyticsPeriod;
  onPeriodChange: (p: AnalyticsPeriod) => void;
}

export function DealerDashboard({ period, onPeriodChange }: DealerDashboardProps) {
  const { data, loading, error, refetch } = useDealerAnalytics(period);
  const [stageCue, setStageCue] = useState("");
  const [exporting, setExporting] = useState(false);

  const funnel = data?.conversionFunnel ?? emptyFunnel();
  const ttc = data?.timeToClose ?? emptyTimeToClose();
  const approval = data?.approvalRateByBucket ?? emptyApprovalBuckets();

  const showChartsLoading = loading && !data;

  const emptyAfterLoad = Boolean(data && isEffectivelyEmpty(data) && !loading);

  const filename = useMemo(() => `dealer-analytics-${period}-${new Date().toISOString().slice(0, 10)}.csv`, [period]);

  async function exportCsv() {
    setExporting(true);
    try {
      const blob = await exportAnalyticsCSV(period);
      downloadExportedBlob(blob, filename);
    } finally {
      setExporting(false);
    }
  }

  function chartBody(skeletonEl: ReactNode, contentEl: ReactNode) {
    if (showChartsLoading) return skeletonEl;
    if (!data) return <p className="text-sm text-gray-500">Sin datos.</p>;
    return contentEl;
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 md:py-10" data-testid="dealer-analytics-dashboard">
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end lg:justify-between lg:gap-6">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/95">Credit · Dealer</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">Analítica de conversión</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-400">
            Embudo, tiempo de cierre, tasas por segmento y métricas. Datos desde{" "}
            <span className="font-mono text-gray-500">/api/v2/credit/analytics/</span> y{" "}
            <span className="font-mono text-gray-500">/credit/dashboard/summary</span>.
          </p>
          <span className="sr-only" aria-live="polite">
            {stageCue ? `Embudo seleccionado ${stageCue}` : ""}
          </span>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <PeriodSelector value={period} onChange={onPeriodChange} disabled={loading} />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              data-testid="dealer-refresh"
              onClick={() => void refetch()}
              disabled={loading}
              className="min-h-[44px] rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-gray-100 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Actualizar
            </button>
            <button
              type="button"
              data-testid="dealer-export-csv"
              onClick={() => void exportCsv()}
              disabled={exporting || loading}
              className="min-h-[44px] rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-900/40 transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-800 disabled:opacity-60"
            >
              {exporting ? "Exportando…" : "Exportar CSV"}
            </button>
          </div>
        </div>
      </header>

      {error != null ? (
        <div
          className="mb-6 rounded-2xl border border-red-400/35 bg-red-500/15 p-4 text-red-100"
          role="alert"
          data-testid="dealer-analytics-error"
        >
          <p className="font-medium">{error.message}</p>
          <button
            type="button"
            data-testid="dealer-error-retry"
            className="mt-3 rounded-md border border-white/20 px-3 py-2 text-sm text-white hover:bg-white/10"
            onClick={() => void refetch()}
          >
            Reintentar
          </button>
        </div>
      ) : null}

      <DealerAnalyticsErrorBoundary slug="kpis">
        <PerformanceMetricsCards metrics={data?.performanceMetrics ?? null} loading={loading && !data} />
      </DealerAnalyticsErrorBoundary>

      {emptyAfterLoad ? (
        <p className="my-10 text-center text-sm text-gray-500" data-testid="dealer-analytics-empty">
          No hay actividad en el periodo seleccionado.
        </p>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/35 p-4 shadow-inner backdrop-blur sm:p-6">
          <h2 className="mb-3 text-lg font-semibold text-white">Embudo</h2>
          <DealerAnalyticsErrorBoundary slug="funnel">
            {chartBody(
              <ConversionFunnelSkeleton />,
              <ConversionFunnel
                funnel={funnel}
                loading={false}
                onStageClick={(stage) => {
                  setStageCue(stage);
                  return undefined;
                }}
              />,
            )}
          </DealerAnalyticsErrorBoundary>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/35 p-4 shadow-inner backdrop-blur sm:p-6">
          <h2 className="mb-3 text-lg font-semibold text-white">Tiempo a cierre</h2>
          <DealerAnalyticsErrorBoundary slug="ttc">{chartBody(<TimeToCloseSkeleton />, <TimeToCloseChart timeToClose={ttc} loading={false} />)}</DealerAnalyticsErrorBoundary>
        </div>
      </div>

      <section className="mt-8 rounded-2xl border border-white/10 bg-black/35 p-4 shadow-inner backdrop-blur sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Tasa de aprobación por cubeta</h2>
        <DealerAnalyticsErrorBoundary slug="approval">
          {chartBody(<ApprovalRateSkeleton />, <ApprovalRateByBucket approval={approval} loading={false} />)}
        </DealerAnalyticsErrorBoundary>
      </section>
    </div>
  );
}

"use client";

import { Component, type ReactNode, useState } from "react";
import { AnomaliesPanel, AnomaliesSkeleton } from "@/components/bank/analytics/AnomaliesPanel";
import { BankPeriodSelector } from "@/components/bank/analytics/BankPeriodSelector";
import { DecisionDistribution, DecisionSkeleton } from "@/components/bank/analytics/DecisionDistribution";
import { PortfolioOverviewCards } from "@/components/bank/analytics/PortfolioOverviewCards";
import { RiskHeatmap, RiskHeatmapSkeleton } from "@/components/bank/analytics/RiskHeatmap";
import { StipulationsFrequency, StipulationsSkeleton } from "@/components/bank/analytics/StipulationsFrequency";
import { useBankAnalytics } from "@/hooks/useBankAnalytics";
import { maskBankAnalyticsText } from "@/lib/bank/analytics-api";
import type { BankAnalytics, BankAnalyticsPeriod } from "@/types/bank-analytics";

function emptyAnalytics(): BankAnalytics {
  return {
    portfolioOverview: {
      totalOffers: 0,
      activeApplications: 0,
      approvalRate: 0,
      stipulationsFrequency: 0,
    },
    riskHeatmap: { cells: [] },
    decisionDistribution: {
      approved: 0,
      declined: 0,
      pending: 0,
      withdrawn: 0,
    },
    stipulationsFrequency: { topStipulations: [] },
    anomalies: [],
  };
}

class BankAnalyticsChartBoundary extends Component<{ slug: string; children: ReactNode }, { error: Error | null }> {
  constructor(props: { slug: string; children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): { error: Error } {
    return { error };
  }

  componentDidCatch(): void {}

  render() {
    if (this.state.error) {
      return (
        <div
          className="rounded-2xl border border-red-500/35 bg-red-950/55 p-4 text-sm text-red-100"
          role="alert"
          data-testid={`bank-analytics-chart-error-${this.props.slug}`}
        >
          <p className="font-semibold">Fallo de renderizado en {this.props.slug}.</p>
          <p className="mt-1 text-xs text-red-300/95">{this.state.error.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

interface BankPortfolioDashboardProps {
  period: BankAnalyticsPeriod;
  onPeriodChange: (p: BankAnalyticsPeriod) => void;
}

export function BankPortfolioDashboard({ period, onPeriodChange }: BankPortfolioDashboardProps) {
  const { data, loading, error, forbidden, roleHeader, refetch } = useBankAnalytics(period);
  const [cue, setCue] = useState("");

  const snapshot = data ?? emptyAnalytics();
  const showSkeletons = loading && !data;

  const noSignal =
    Boolean(data) &&
    data!.portfolioOverview.totalOffers === 0 &&
    data!.portfolioOverview.activeApplications === 0 &&
    data!.riskHeatmap.cells.every((cell) => cell.volume === 0) &&
    data!.stipulationsFrequency.topStipulations.length === 0 &&
    data!.anomalies.length === 0 &&
    data!.decisionDistribution.approved +
      data!.decisionDistribution.declined +
      data!.decisionDistribution.pending +
      data!.decisionDistribution.withdrawn ===
      0;

  if (!loading && forbidden) {
    return (
      <div
        className="mx-auto max-w-3xl px-4 py-10 text-center text-sm text-amber-200"
        role="alert"
        data-testid="bank-dashboard-forbidden"
      >
        <p className="font-semibold">Este panel exige BANK_ANALYST o BANK_ADMIN con encabezado X-Role.</p>
        <p className="mt-3 text-xs text-gray-400">
          Ajuste el valor de nadakki_role/localStorage antes de cargar KPIs sintéticos.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1250px] px-4 py-6 md:py-12" data-testid="bank-analytics-dashboard">
      <header className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.18em] text-fuchsia-200/95">Portfolio · BANK</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">Analítica de portafolio</h1>
          <p className="mt-2 max-w-3xl text-sm text-gray-400">
            Exposiciones agregadas, mapas de calor sintéticos, decisiones combinadas y anomalías vigiladas sin exportes
            descargables.
          </p>
          <p
            className="mt-3 text-[11px] font-mono text-gray-400"
            aria-live="polite"
            data-testid="bank-dashboard-role-chip"
          >
            X-Role efectivo:&nbsp;<span className="text-white">{roleHeader ?? "pendiente"}</span>
          </p>
          <span className="sr-only" aria-live="polite">
            {cue ? `Selección rápida: ${cue}` : ""}
          </span>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <div className="flex flex-col items-stretch gap-1 sm:items-end">
            <BankPeriodSelector disabled value={period} onChange={() => {}} />
            <p className="text-[10px] text-gray-500" data-testid="bank-period-unavailable">
              Periodo no disponible — snapshot del tenant (API sin filtro temporal)
            </p>
          </div>
          <button
            type="button"
            data-testid="bank-analytics-refresh"
            disabled={loading}
            onClick={() => void refetch()}
            className="min-h-[44px] rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-gray-50 transition-colors hover:bg-white/10 disabled:opacity-35"
          >
            Actualizar vistas
          </button>
        </div>
      </header>

      {error ? (
        <div
          className="mt-8 rounded-xl border border-rose-500/45 bg-rose-950/60 p-4 text-sm text-rose-50"
          role="alert"
          data-testid="bank-analytics-error"
        >
          <p>{error.message}</p>
          <button
            type="button"
            data-testid="bank-analytics-error-retry"
            className="mt-4 rounded-lg border border-white/25 px-3 py-2 text-xs uppercase tracking-wide"
            onClick={() => void refetch()}
          >
            Reintentar
          </button>
        </div>
      ) : null}

      {noSignal && !loading && !error ? (
        <p className="mx-auto mt-8 max-w-2xl text-center text-xs text-gray-500" data-testid="bank-analytics-empty-state">
          No hay señales agregadas en el window temporal actual.
        </p>
      ) : null}

      <div className="mt-10">
        <BankAnalyticsChartBoundary slug="overview">
          <PortfolioOverviewCards overview={data?.portfolioOverview ?? null} loading={showSkeletons} />
        </BankAnalyticsChartBoundary>
      </div>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-white">Mapa volumen × riesgo</h2>
        <BankAnalyticsChartBoundary slug="heatmap">
          {showSkeletons ? <RiskHeatmapSkeleton /> : <RiskHeatmap cells={snapshot.riskHeatmap.cells} loading={false} />}
        </BankAnalyticsChartBoundary>
      </section>

      <section className="mt-12 grid gap-8 xl:grid-cols-2">
        <div>
          <h2 className="sr-only">Distribución histórica de decisiones</h2>
          <BankAnalyticsChartBoundary slug="decision">
            {showSkeletons ? (
              <DecisionSkeleton />
            ) : (
              <DecisionDistribution decision={snapshot.decisionDistribution} loading={false} />
            )}
          </BankAnalyticsChartBoundary>
        </div>
        <div>
          <h2 className="sr-only">Frecuencia de estipulaciones</h2>
          <BankAnalyticsChartBoundary slug="stipulations">
            {showSkeletons ? (
              <StipulationsSkeleton />
            ) : (
              <StipulationsFrequency
                items={snapshot.stipulationsFrequency.topStipulations}
                loading={false}
                onPick={(raw) =>
                  setCue(`Foco en ${maskBankAnalyticsText(raw).slice(0, 140)} (${new Date().toLocaleTimeString("es-DO")})`)
                }
              />
            )}
          </BankAnalyticsChartBoundary>
        </div>
      </section>

      <section className="mt-12">
        <BankAnalyticsChartBoundary slug="anomalies">
          {showSkeletons ? <AnomaliesSkeleton /> : <AnomaliesPanel items={snapshot.anomalies} loading={false} />}
        </BankAnalyticsChartBoundary>
      </section>

      {!showSkeletons && data ? (
        <p className="mt-12 text-[10px] text-gray-500">
          Esta vista queda disponible sólo dentro del perímetro autenticado; el servidor audita cada apertura.
        </p>
      ) : null}
    </div>
  );
}

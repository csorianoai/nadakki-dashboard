"use client";

import type { DealerAnalytics } from "@/types/dealer-analytics";

function fmtMoney(n: number): string {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    maximumFractionDigits: 0,
  }).format(n);
}

export function PerformanceMetricsCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" data-testid="dealer-performance-skeleton">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="min-h-[5.5rem] animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]" aria-hidden />
      ))}
    </div>
  );
}

interface PerformanceMetricsCardsProps {
  metrics: DealerAnalytics["performanceMetrics"] | null;
  loading: boolean;
}

export function PerformanceMetricsCards({ metrics, loading }: PerformanceMetricsCardsProps) {
  if (loading || !metrics) {
    return <PerformanceMetricsCardsSkeleton />;
  }

  const cards = [
    { label: "Ticket promedio", value: fmtMoney(metrics.avgDealSize), testId: "dealer-kpi-deal-size" },
    { label: "Volumen total", value: fmtMoney(metrics.totalVolume), testId: "dealer-kpi-volume" },
    { label: "Tasa de aprobación", value: `${metrics.approvalRate.toFixed(1)}%`, testId: "dealer-kpi-approval" },
    { label: "NPS", value: `${metrics.npsScore}`, testId: "dealer-kpi-nps" },
  ];

  return (
    <section
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
      aria-label="Métricas de desempeño"
      data-testid="performance-metrics-cards"
    >
      {cards.map((c) => (
        <article
          key={c.testId}
          data-testid={c.testId}
          className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-transparent p-4 shadow-lg shadow-black/20"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{c.label}</p>
          <p className="mt-2 truncate text-xl font-semibold tracking-tight text-white sm:text-2xl">{c.value}</p>
        </article>
      ))}
    </section>
  );
}

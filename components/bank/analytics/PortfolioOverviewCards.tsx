"use client";

import type { BankAnalytics } from "@/types/bank-analytics";

function fmtMoney(n: number): string {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    maximumFractionDigits: 0,
  }).format(n);
}

export function PortfolioOverviewSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" data-testid="bank-portfolio-skeleton">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="min-h-[5.5rem] animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]" aria-hidden />
      ))}
    </div>
  );
}

interface PortfolioOverviewCardsProps {
  overview: BankAnalytics["portfolioOverview"] | null;
  loading: boolean;
}

export function PortfolioOverviewCards({ overview, loading }: PortfolioOverviewCardsProps) {
  if (loading || !overview) {
    return <PortfolioOverviewSkeleton />;
  }

  const cards = [
    { label: "Exposición total", value: fmtMoney(overview.totalExposure), testId: "bank-kpi-exposure" },
    {
      label: "Solicitudes activas",
      value: `${overview.activeApplications}`,
      testId: "bank-kpi-active-apps",
    },
    { label: "Tasa aprobación", value: `${overview.approvalRate.toFixed(1)}%`, testId: "bank-kpi-approval" },
    {
      label: "Frecuencia estip.",
      value: `${overview.stipulationsFrequency.toFixed(1)}%`,
      testId: "bank-kpi-stip-freq",
    },
  ];

  return (
    <section
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
      aria-label="Resumen de portafolio agregado (sin datos personales)"
      data-testid="bank-portfolio-overview-cards"
    >
      {cards.map((c) => (
        <article
          key={c.testId}
          data-testid={c.testId}
          className="rounded-2xl border border-white/10 bg-gradient-to-br from-fuchsia-500/15 to-transparent p-4 shadow-lg shadow-black/25"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-fuchsia-200/95">{c.label}</p>
          <p className="mt-2 truncate text-xl font-semibold tracking-tight text-white sm:text-2xl">{c.value}</p>
          <p className="sr-only">
            KPI agregado; no muestra solicitantes individuales, cédulas ni correos.
          </p>
        </article>
      ))}
    </section>
  );
}

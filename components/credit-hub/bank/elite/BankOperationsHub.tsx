"use client";

import { Gavel, HandCoins, FileWarning } from "lucide-react";
import { MetricCard } from "@/components/credit-hub/elite/MetricCard";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import { BankDecisionFunnel } from "@/components/credit-hub/bank/elite/BankDecisionFunnel";
import { RiskPortfolioPanel } from "@/components/credit-hub/elite/RiskPortfolioPanel";
import { useRiskDistributions } from "@/lib/credit-hub/hooks/useRiskDistributions";
import type { BankDashboardAnalytics } from "@/lib/credit-hub/types/bankDecision";
import type { BankQueueItem } from "@/lib/credit-hub/types/bankDecision";
import type { DistributionBucket } from "@/lib/credit-hub/types/analytics";

const EMPTY_BUCKETS: DistributionBucket[] = [];

export function BankOperationsHub({
  analytics,
  queue,
  pending,
  counterOffers,
  stipulationsCount,
}: {
  analytics?: BankDashboardAnalytics;
  queue: BankQueueItem[];
  pending: number;
  counterOffers: number;
  stipulationsCount: number;
}) {
  const riskQuery = useRiskDistributions();
  const hasReal =
    !!riskQuery.data &&
    (riskQuery.data.pti_distribution.some((b) => b.count > 0) ||
      riskQuery.data.ltv_distribution.some((b) => b.count > 0));

  const pti = hasReal ? riskQuery.data!.pti_distribution : EMPTY_BUCKETS;
  const ltv = hasReal ? riskQuery.data!.ltv_distribution : EMPTY_BUCKETS;
  const rejections =
    hasReal && riskQuery.data!.rejection_reasons.length ? riskQuery.data!.rejection_reasons : [];

  const actionCards = [
    {
      label: "Decisiones pendientes",
      value: pending,
      icon: Gavel,
      truth: "REAL" as const,
      delta: { direction: "up" as const, label: "requieren analista" },
      trendDemo: true,
    },
    {
      label: "Contraofertas activas",
      value: counterOffers || "—",
      icon: HandCoins,
      truth: counterOffers ? ("REAL" as const) : ("ROADMAP" as const),
      trendDemo: !counterOffers,
    },
    {
      label: "Estipulaciones por revisar",
      value: stipulationsCount || "—",
      icon: FileWarning,
      truth: stipulationsCount ? ("REAL" as const) : ("ROADMAP" as const),
      trendDemo: !stipulationsCount,
    },
  ];

  return (
    <section data-testid="bank-operations-hub" className="mb-[26px]">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="ch-eyebrow">Operaciones</span>
        <h2 className="ch-serif" style={{ margin: 0, fontSize: 19 }}>
          Acciones y embudo
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        {actionCards.map((c) => (
          <MetricCard key={c.label} {...c} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <BankDecisionFunnel analytics={analytics} queue={queue} truth={analytics ? "REAL" : "ROADMAP"} />
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="ch-eyebrow">Riesgo y portafolio</span>
            <DataTruthBadge level={hasReal ? "REAL" : "ROADMAP"} />
          </div>
          {hasReal ? (
            <RiskPortfolioPanel
              pti={pti}
              ltv={ltv}
              rejections={rejections.slice(0, 3)}
              truth="REAL"
              loading={riskQuery.isLoading}
              compact
            />
          ) : (
            <p style={{ fontSize: 12, color: "var(--ch-text-3)", margin: 0 }}>
              Mini-panel PTI/LTV pendiente de datos del servicio.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

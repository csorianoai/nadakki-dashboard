"use client";

import { Gavel, HandCoins, FileWarning } from "lucide-react";
import { MetricCard } from "@/components/credit-hub/elite/MetricCard";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import { BankDecisionFunnel } from "@/components/credit-hub/bank/elite/BankDecisionFunnel";
import { RiskPortfolioPanel } from "@/components/credit-hub/elite/RiskPortfolioPanel";
import { useRiskDistributions } from "@/lib/credit-hub/hooks/useRiskDistributions";
import type { BankDashboardAnalytics } from "@/lib/credit-hub/types/bankDecision";
import type { BankQueueItem } from "@/lib/credit-hub/types/bankDecision";
import type { DistributionBucket, RejectionReasonRow } from "@/lib/credit-hub/types/analytics";

const DEMO_PTI: DistributionBucket[] = [
  { band: "0-20%", count: 3, pct: 35 },
  { band: "20-30%", count: 4, pct: 40 },
  { band: "30-40%", count: 2, pct: 18 },
  { band: "50%+", count: 1, pct: 7 },
];

const DEMO_LTV: DistributionBucket[] = [
  { band: "0-60%", count: 2, pct: 22 },
  { band: "60-70%", count: 4, pct: 45 },
  { band: "70-80%", count: 2, pct: 28 },
  { band: "90%+", count: 1, pct: 5 },
];

const DEMO_REJECTIONS: RejectionReasonRow[] = [
  { reason_code: "RC101", reason: "Política crediticia", count: 5, pct: 40 },
];

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

  const pti = hasReal ? riskQuery.data!.pti_distribution : DEMO_PTI;
  const ltv = hasReal ? riskQuery.data!.ltv_distribution : DEMO_LTV;
  const rejections =
    hasReal && riskQuery.data!.rejection_reasons.length ? riskQuery.data!.rejection_reasons : DEMO_REJECTIONS;

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
      truth: stipulationsCount ? ("REAL" as const) : ("DEMO" as const),
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
        <BankDecisionFunnel analytics={analytics} queue={queue} truth={analytics ? "REAL" : "DEMO"} />
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="ch-eyebrow">Riesgo y portafolio</span>
            <DataTruthBadge level={hasReal ? "REAL" : "DEMO"} />
          </div>
          <RiskPortfolioPanel
            pti={pti}
            ltv={ltv}
            rejections={rejections.slice(0, 3)}
            truth={hasReal ? "REAL" : "DEMO"}
            loading={riskQuery.isLoading}
            compact
          />
        </div>
      </div>
    </section>
  );
}

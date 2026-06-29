"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { EmptyStateRich, KpiStripSkeleton, TableSkeleton } from "@/components/credit-hub/primitives";
import { BankGoals } from "@/components/credit-hub/bank/sections/BankGoals";
import { AuctionIntel } from "@/components/credit-hub/bank/sections/AuctionIntel";
import { RiskCreditPanel } from "@/components/credit-hub/bank/sections/RiskCreditPanel";
import { ComplianceFooter } from "@/components/credit-hub/elite";
import { BankCockpitHeader } from "@/components/credit-hub/bank/elite/BankCockpitHeader";
import { BankKpiStrip } from "@/components/credit-hub/bank/elite/BankKpiStrip";
import { BankDecisionQueueSpotlight } from "@/components/credit-hub/bank/elite/BankDecisionQueueSpotlight";
import { BankOperationsHub } from "@/components/credit-hub/bank/elite/BankOperationsHub";
import { BankAnalystProductivity } from "@/components/credit-hub/bank/elite/BankAnalystProductivity";
import type { BankDashboardViewProps } from "@/lib/credit-hub/types/bank-views";
import { PRIORITY_RANK, pendingQueueCount } from "@/lib/credit-hub/bank/bankFormat";

export function BankDashboardView({
  queue,
  analytics,
  institutionName,
  complianceSummary,
  isLoading,
  isError,
  onRetry,
}: BankDashboardViewProps) {
  const router = useRouter();
  const [period, setPeriod] = useState<"today" | "week" | "month">("week");
  const pending = pendingQueueCount(analytics, queue);

  const topQueue = useMemo(() => {
    return [...queue]
      .filter((x) => x.state !== "decided" && x.state !== "DECIDED" && !x.bank_decision)
      .sort((x, y) => PRIORITY_RANK[x.priority] - PRIORITY_RANK[y.priority] || y.score - x.score)
      .slice(0, 10);
  }, [queue]);

  const counterOffers = useMemo(() => queue.filter((q) => q.state?.toLowerCase().includes("counter")).length, [queue]);
  const stipulationsCount = useMemo(() => Math.min(counterOffers + 2, 5), [counterOffers]);

  const showDemoBanner =
    institutionName.toLowerCase().includes("demo") || institutionName.toLowerCase().includes("nadakki");

  if (isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <KpiStripSkeleton n={7} />
        <TableSkeleton rows={5} />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyStateRich
        variant="error"
        primary={
          <button type="button" className="ch-btn ch-btn-secondary" onClick={onRetry}>
            Reintentar
          </button>
        }
      />
    );
  }

  return (
    <div data-testid="bank-decision-desk" className="min-w-0 pb-8">
      <BankCockpitHeader
        institutionName={institutionName}
        complianceSummary={complianceSummary}
        period={period}
        onPeriodChange={setPeriod}
        showDemoBanner={showDemoBanner}
        lastSyncedLabel="Sincronizado hace unos minutos"
      />

      <BankKpiStrip
        analytics={analytics}
        queue={queue}
        pending={pending}
        topQueueCount={topQueue.length}
        onQueueClick={() => router.push("/credit-hub/bank/applications")}
      />

      <hr className="ch-section-break" aria-hidden />

      <BankGoals analytics={analytics} queueCount={pending} />

      <hr className="ch-section-break" aria-hidden />

      <BankDecisionQueueSpotlight
        items={topQueue}
        pending={pending}
        counterOffers={counterOffers}
        onViewAll={() => router.push("/credit-hub/bank/applications")}
      />

      <hr className="ch-section-break" aria-hidden />

      <BankOperationsHub
        analytics={analytics}
        queue={queue}
        pending={pending}
        counterOffers={counterOffers}
        stipulationsCount={stipulationsCount}
      />

      <hr className="ch-section-break" aria-hidden />

      <BankAnalystProductivity analytics={analytics} />

      <hr className="ch-section-break" aria-hidden />

      <RiskCreditPanel />

      <hr className="ch-section-break" aria-hidden />

      <AuctionIntel analytics={analytics} />

      <ComplianceFooter variant="bank" />
    </div>
  );
}

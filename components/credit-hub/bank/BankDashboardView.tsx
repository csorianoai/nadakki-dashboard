"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { KpiStripSkeleton, TableSkeleton } from "@/components/credit-hub/primitives";
import { BankGoals } from "@/components/credit-hub/bank/sections/BankGoals";
import { AuctionIntel } from "@/components/credit-hub/bank/sections/AuctionIntel";
import { RiskCreditPanel } from "@/components/credit-hub/bank/sections/RiskCreditPanel";
import { BankExperienceKpisPanel } from "@/components/credit-hub/bank/sections/BankExperienceKpisPanel";
import { ComplianceFooter } from "@/components/credit-hub/elite";
import { BankCockpitHeader } from "@/components/credit-hub/bank/elite/BankCockpitHeader";
import { BankKpiStrip } from "@/components/credit-hub/bank/elite/BankKpiStrip";
import { BankDecisionQueueSpotlight } from "@/components/credit-hub/bank/elite/BankDecisionQueueSpotlight";
import { BankOperationsHub } from "@/components/credit-hub/bank/elite/BankOperationsHub";
import { BankAnalystProductivity } from "@/components/credit-hub/bank/elite/BankAnalystProductivity";
import { CHPanelBoundary } from "@/components/credit-hub/system/CHPanelBoundary";
import { CHPanelState } from "@/components/credit-hub/system/CHPanelState";
import type { BankDashboardViewProps } from "@/lib/credit-hub/types/bank-views";
import { PRIORITY_RANK, pendingQueueCount } from "@/lib/credit-hub/bank/bankFormat";

export function BankDashboardView({
  queue,
  analytics,
  institutionName,
  complianceSummary,
  queueLoading,
  analyticsLoading,
  queueError,
  analyticsError,
  onRetryQueue,
  onRetryAnalytics,
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
  /** No stipulations KPI endpoint on this card yet — never invent counts (ROADMAP). */
  const stipulationsCount = 0;

  const showDemoBanner =
    institutionName.toLowerCase().includes("demo") || institutionName.toLowerCase().includes("nadakki");

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

      <CHPanelState
        isLoading={queueLoading}
        isError={queueError}
        onRetry={onRetryQueue}
        errorTitle="KPIs de cola no disponibles"
        loadingFallback={
          <>
            <KpiStripSkeleton n={7} />
            <TableSkeleton rows={5} />
          </>
        }
      >
        {analyticsError ? (
          <div
            role="status"
            className="ch-card"
            style={{
              marginBottom: 12,
              padding: "10px 14px",
              fontSize: 12.5,
              color: "var(--ch-warning-text)",
              background: "var(--ch-warning-soft)",
              border: "1px solid var(--ch-warning-line, var(--ch-line))",
            }}
          >
            KPIs de analytics no disponibles — mostrando métricas de cola.{" "}
            {onRetryAnalytics ? (
              <button type="button" className="ch-btn ch-btn-sm ch-btn-secondary" onClick={onRetryAnalytics}>
                Reintentar analytics
              </button>
            ) : null}
          </div>
        ) : null}
        <BankKpiStrip
          analytics={analytics}
          queue={queue}
          pending={pending}
          topQueueCount={topQueue.length}
          analyticsUnavailable={analyticsError || (!analytics && !analyticsLoading)}
          onQueueClick={() => router.push("/credit-hub/bank/applications")}
        />
        <div style={{ marginTop: 12 }}>
          <BankExperienceKpisPanel period={period} />
        </div>
      </CHPanelState>

      <hr className="ch-section-break" aria-hidden />

      <CHPanelBoundary label="Metas de mesa">
        <BankGoals />
      </CHPanelBoundary>

      <hr className="ch-section-break" aria-hidden />

      <CHPanelBoundary label="Cola de decisión">
        <CHPanelState
          isLoading={queueLoading}
          isError={queueError}
          onRetry={onRetryQueue}
          errorTitle="Bandeja no disponible"
          loadingFallback={<TableSkeleton rows={4} />}
        >
          <BankDecisionQueueSpotlight
            items={topQueue}
            pending={pending}
            counterOffers={counterOffers}
            onViewAll={() => router.push("/credit-hub/bank/applications")}
          />
        </CHPanelState>
      </CHPanelBoundary>

      <hr className="ch-section-break" aria-hidden />

      <CHPanelBoundary label="Operaciones">
        <BankOperationsHub
          analytics={analytics}
          queue={queue}
          pending={pending}
          counterOffers={counterOffers}
          stipulationsCount={stipulationsCount}
        />
      </CHPanelBoundary>

      <hr className="ch-section-break" aria-hidden />

      <CHPanelBoundary label="Productividad analista">
        <BankAnalystProductivity analytics={analytics} />
      </CHPanelBoundary>

      <hr className="ch-section-break" aria-hidden />

      <CHPanelBoundary label="Riesgo y cartera">
        <RiskCreditPanel />
      </CHPanelBoundary>

      <hr className="ch-section-break" aria-hidden />

      <CHPanelBoundary label="Inteligencia de subasta">
        <AuctionIntel analytics={analytics} />
      </CHPanelBoundary>

      <ComplianceFooter variant="bank" />
    </div>
  );
}

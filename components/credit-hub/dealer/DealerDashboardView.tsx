"use client";

import { useMemo } from "react";
import { KpiStripSkeleton } from "@/components/credit-hub/primitives";
import { BankRanking } from "@/components/credit-hub/dealer/sections/BankRanking";
import { DealerGoals } from "@/components/credit-hub/dealer/sections/DealerGoals";
import { DealerCockpitHeader } from "@/components/credit-hub/dealer/elite/DealerCockpitHeader";
import { DealerKpiStrip } from "@/components/credit-hub/dealer/elite/DealerKpiStrip";
import { OfferComparatorSpotlight } from "@/components/credit-hub/dealer/elite/OfferComparatorSpotlight";
import { DealerPipelineRail } from "@/components/credit-hub/dealer/elite/DealerPipelineRail";
import { RecentApplicationsTable } from "@/components/credit-hub/dealer/elite/RecentApplicationsTable";
import { DealerTrendsAlerts } from "@/components/credit-hub/dealer/elite/DealerTrendsAlerts";
import { ComplianceFooter } from "@/components/credit-hub/elite";
import { CHPanelBoundary } from "@/components/credit-hub/system/CHPanelBoundary";
import { CHPanelState } from "@/components/credit-hub/system/CHPanelState";
import { useDashboardSummary } from "@/lib/credit-hub/hooks/useDashboardSummary";
import { useBanksRanking } from "@/lib/credit-hub/hooks/useBanksRanking";
import type { DealerDashboardViewProps } from "@/lib/credit-hub/types/dealer-views";
import {
  activeApplicationsFromList,
  applicationsThisWeek,
} from "@/lib/credit-hub/dealer/dealer-pipeline-metrics";
import { formatDealerMoney } from "@/lib/credit-hub/dealer/dealerFormat";

export function DealerDashboardView({
  applications,
  stats,
  institutionName,
  userName,
  locale: _locale,
  currency,
  isLoading,
  isError,
  onRetry,
}: DealerDashboardViewProps) {
  const summaryQuery = useDashboardSummary();
  const banksQuery = useBanksRanking();
  const summary = summaryQuery.data?.summary;

  const activeApps = useMemo(
    () =>
      [...activeApplicationsFromList(applications)].sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      ),
    [applications],
  );

  const weekCount = applicationsThisWeek(applications);
  const pipelineAmount = useMemo(
    () => activeApps.reduce((sum, a) => sum + Number(a.requested_amount || 0), 0),
    [activeApps],
  );

  const showDemoBanner =
    institutionName.toLowerCase().includes("demo") ||
    institutionName.toLowerCase().includes("nadakki");

  const pipelineLabel = formatDealerMoney(String(pipelineAmount), currency);

  return (
    <div data-testid="dealer-command-center" className="min-w-0 pb-8">
      <DealerCockpitHeader institutionName={institutionName} userName={userName} showDemoBanner={showDemoBanner} />

      <CHPanelState
        isLoading={isLoading}
        isError={isError}
        onRetry={onRetry}
        errorTitle="KPIs del dealer no disponibles"
        loadingFallback={<KpiStripSkeleton n={8} />}
      >
        <DealerKpiStrip
          stats={stats}
          summary={summary}
          pipelineAmount={pipelineAmount}
          currency={currency}
          weekCount={weekCount}
          banks={banksQuery.data?.banks}
        />
      </CHPanelState>

      <hr className="ch-section-break" aria-hidden />

      <CHPanelBoundary label="Metas">
        <DealerGoals stats={stats} applications={applications} currency={currency} />
      </CHPanelBoundary>

      <hr className="ch-section-break" aria-hidden />

      <CHPanelBoundary label="Comparador de ofertas">
        <OfferComparatorSpotlight applications={applications} currency={currency} />
      </CHPanelBoundary>

      <hr className="ch-section-break" aria-hidden />

      <CHPanelBoundary label="Pipeline">
        <CHPanelState
          isLoading={summaryQuery.isLoading}
          isError={summaryQuery.isError}
          onRetry={() => void summaryQuery.refetch()}
          errorTitle="Resumen de pipeline no disponible"
        >
          <DealerPipelineRail summary={summary} applications={applications} currency={currency} />
        </CHPanelState>
      </CHPanelBoundary>

      <hr className="ch-section-break" aria-hidden />

      <CHPanelBoundary label="Ranking de bancos">
        <BankRanking />
      </CHPanelBoundary>

      <hr className="ch-section-break" aria-hidden />

      <CHPanelBoundary label="Solicitudes recientes">
        <RecentApplicationsTable apps={applications.length ? applications : activeApps} currency={currency} />
      </CHPanelBoundary>

      <hr className="ch-section-break" aria-hidden />

      <CHPanelBoundary label="Tendencias y alertas">
        <DealerTrendsAlerts
          applications={applications}
          currency={currency}
          approvalRate={stats?.approval_rate}
          pipelineAmountLabel={pipelineLabel}
          banks={banksQuery.data?.banks}
        />
      </CHPanelBoundary>

      <ComplianceFooter variant="dealer" />
    </div>
  );
}

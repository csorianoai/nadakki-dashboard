"use client";

import Link from "next/link";
import { useMemo } from "react";
import { EmptyStateRich, KpiStripSkeleton } from "@/components/credit-hub/primitives";
import { BankRanking } from "@/components/credit-hub/dealer/sections/BankRanking";
import { DealerGoals } from "@/components/credit-hub/dealer/sections/DealerGoals";
import { DealerCockpitHeader } from "@/components/credit-hub/dealer/elite/DealerCockpitHeader";
import { DealerKpiStrip } from "@/components/credit-hub/dealer/elite/DealerKpiStrip";
import { OfferComparatorSpotlight } from "@/components/credit-hub/dealer/elite/OfferComparatorSpotlight";
import { DealerPipelineRail } from "@/components/credit-hub/dealer/elite/DealerPipelineRail";
import { RecentApplicationsTable } from "@/components/credit-hub/dealer/elite/RecentApplicationsTable";
import { DealerTrendsAlerts } from "@/components/credit-hub/dealer/elite/DealerTrendsAlerts";
import { ComplianceFooter } from "@/components/credit-hub/elite";
import { useDashboardSummary } from "@/lib/credit-hub/hooks/useDashboardSummary";
import { useBanksRanking } from "@/lib/credit-hub/hooks/useBanksRanking";
import type { DealerDashboardViewProps } from "@/lib/credit-hub/types/dealer-views";
import {
  activeApplicationsFromList,
  applicationsThisWeek,
} from "@/lib/credit-hub/dealer/dealer-pipeline-metrics";
import { formatDealerMoney } from "@/lib/credit-hub/dealer/dealerFormat";

/**
 * Dealer Command Center — layout alineado al prototipo Cockpit del Dealer (tema claro).
 * Ruta REAL: app/(forge)/credit-hub/dealer/page.tsx
 */
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

  if (isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <KpiStripSkeleton n={8} />
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

  const pipelineLabel = formatDealerMoney(String(pipelineAmount), currency);

  return (
    <div data-testid="dealer-command-center" className="min-w-0 pb-8">
      <DealerCockpitHeader institutionName={institutionName} userName={userName} showDemoBanner={showDemoBanner} />

      <DealerKpiStrip
        stats={stats}
        summary={summary}
        pipelineAmount={pipelineAmount}
        currency={currency}
        weekCount={weekCount}
        banks={banksQuery.data?.banks}
      />

      <DealerGoals stats={stats} applications={applications} currency={currency} />

      <OfferComparatorSpotlight applications={applications} currency={currency} />

      <DealerPipelineRail summary={summary} applications={applications} currency={currency} />

      <BankRanking />

      <RecentApplicationsTable apps={applications.length ? applications : activeApps} currency={currency} />

      <DealerTrendsAlerts
        applications={applications}
        currency={currency}
        approvalRate={stats?.approval_rate}
        pipelineAmountLabel={pipelineLabel}
        banks={banksQuery.data?.banks}
      />

      <ComplianceFooter variant="dealer" />
    </div>
  );
}

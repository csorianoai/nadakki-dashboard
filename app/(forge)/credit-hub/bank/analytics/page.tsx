"use client";

import { BankAnalyticsCharts } from "@/components/credit-hub/bank/BankAnalyticsCharts";
import { BankDealerRanking } from "@/components/credit-hub/bank/BankDealerRanking";
import { BankExecutiveMetrics } from "@/components/credit-hub/bank/BankExecutiveMetrics";
import { BankPortfolioHealth } from "@/components/credit-hub/bank/BankPortfolioHealth";
import { useBankAnalytics, useBankDealersRanking, useBankPortfolioHealth } from "@/lib/credit-hub/hooks/useBankAnalytics";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";

export default function BankAnalyticsPage() {
  const t = useTranslations();
  const analytics = useBankAnalytics();
  const dealers = useBankDealersRanking();
  const health = useBankPortfolioHealth();
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-forge-primary">{t.bank.analytics_kicker}</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-forge-text">Riesgo, ROI y dealers</h1>
      </div>
      <BankExecutiveMetrics analytics={analytics.data} loading={analytics.isLoading} />
      <BankAnalyticsCharts analytics={analytics.data} />
      <div className="grid gap-6 lg:grid-cols-2">
        <BankDealerRanking dealers={dealers.data?.dealers ?? analytics.data?.top_dealers} />
        <BankPortfolioHealth data={health.data} />
      </div>
    </div>
  );
}

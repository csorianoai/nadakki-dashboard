"use client";

import { BankAnalyticsView } from "@/components/credit-hub/bank/BankAnalyticsView";
import { useBankAnalytics, useBankDealersRanking, useBankPortfolioHealth } from "@/lib/credit-hub/hooks/useBankAnalytics";
import type { PortfolioHealthPayload } from "@/lib/credit-hub/types/bank-views";

export default function BankAnalyticsPage() {
  const analyticsQuery = useBankAnalytics();
  const dealersQuery = useBankDealersRanking();
  const portfolioQuery = useBankPortfolioHealth();

  const portfolio = portfolioQuery.data as PortfolioHealthPayload | undefined;

  return (
    <BankAnalyticsView
      analytics={analyticsQuery.data}
      portfolioHealth={portfolio}
      dealers={dealersQuery.data?.dealers ?? analyticsQuery.data?.top_dealers}
      isLoading={analyticsQuery.isLoading}
      isError={!!analyticsQuery.error}
      onRetry={() => {
        void analyticsQuery.refetch();
        void dealersQuery.refetch();
        void portfolioQuery.refetch();
      }}
    />
  );
}

export interface DealerAnalytics {
  conversionFunnel: {
    started: number;
    submitted: number;
    approved: number;
    closed: number;
    dropOffPercents: { stage: string; dropOff: number }[];
  };
  timeToClose: {
    weeklyAverages: { week: string; avgDays: number }[];
    currentAvg: number;
    trend: "up" | "down" | "stable";
  };
  approvalRateByBucket: {
    byAmount: { range: string; rate: number; count: number }[];
    byTerm: { range: string; rate: number; count: number }[];
    byRiskTier: { tier: string; rate: number; count: number }[];
  };
  performanceMetrics: {
    avgDealSize: number;
    totalVolume: number;
    approvalRate: number;
    npsScore: number;
  };
}

export type AnalyticsPeriod = "7d" | "30d" | "90d" | "12m";

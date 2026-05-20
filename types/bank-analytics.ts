/** Period keys sent to `/api/v2/analytics/bank/summary`. */
export type BankAnalyticsPeriod = "7d" | "30d" | "90d" | "12m";

export interface BankAnalytics {
  portfolioOverview: {
    totalExposure: number;
    activeApplications: number;
    approvalRate: number;
    stipulationsFrequency: number;
  };
  riskHeatmap: {
    cells: {
      amountBucket: string;
      riskBucket: string;
      volume: number;
      color: string;
    }[];
  };
  decisionDistribution: {
    approved: number;
    declined: number;
    pending: number;
    withdrawn: number;
  };
  stipulationsFrequency: {
    topStipulations: { name: string; count: number; percent: number }[];
  };
  anomalies: {
    id: string;
    type: string;
    severity: "low" | "medium" | "high" | "critical";
    description: string;
    detectedAt: string;
  }[];
}

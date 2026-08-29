// COPIA SIN ENLACE. La viva es app/(forge)/credit-hub/**
"use client";

import { useState } from "react";
import { BankPortfolioDashboard } from "@/components/bank/analytics/BankPortfolioDashboard";
import type { BankAnalyticsPeriod } from "@/types/bank-analytics";

export default function BankAnalyticsPage() {
  const [period, setPeriod] = useState<BankAnalyticsPeriod>("30d");
  return <BankPortfolioDashboard period={period} onPeriodChange={setPeriod} />;
}

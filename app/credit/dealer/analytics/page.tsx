"use client";

import { useState } from "react";
import { DealerDashboard } from "@/components/credit/dealer/analytics/DealerDashboard";
import { isDealerAnalyticsEnabled } from "@/lib/dealer/analytics-api";
import type { AnalyticsPeriod } from "@/types/dealer-analytics";

export default function DealerAnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("30d");

  if (!isDealerAnalyticsEnabled()) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-10" data-testid="dealer-analytics-flag-off">
        <h1 className="text-xl font-semibold tracking-tight text-white">Analítica de distribuidor</h1>
        <p className="mt-4 max-w-xl text-sm text-gray-400">
          Activa esta vista en compilación con la variable{" "}
          <span className="font-mono text-gray-300">NEXT_PUBLIC_FEATURE_DEALER_ANALYTICS=true</span>.
        </p>
      </div>
    );
  }

  return <DealerDashboard period={period} onPeriodChange={setPeriod} />;
}

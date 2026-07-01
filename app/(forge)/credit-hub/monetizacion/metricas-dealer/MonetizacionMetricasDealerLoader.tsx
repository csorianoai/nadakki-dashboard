"use client";

import { fetchDealerMetrics, fetchDrilldowns } from "@/lib/credit-hub/monetizacion/adapter";
import type { DealerMetrics, DrilldownMap } from "@/lib/credit-hub/monetizacion/types";
import { useMonetizacionQuery } from "@/lib/credit-hub/monetizacion/useMonetizacionQuery";
import {
  MonetizacionScreenError,
  MonetizacionScreenLoading,
} from "@/components/credit-hub/monetizacion/ui/MonetizacionScreenState";
import { MonetizacionMetricasDealerClient } from "./MonetizacionMetricasDealerClient";

type Initial = { metrics: DealerMetrics | null; drilldowns: DrilldownMap };

export function MonetizacionMetricasDealerLoader({ initial }: { initial?: Initial }) {
  const { data, status, retry } = useMonetizacionQuery(
    async () => {
      const [metrics, drilldowns] = await Promise.all([
        fetchDealerMetrics("auto-credito-cibao"),
        fetchDrilldowns(),
      ]);
      return { metrics, drilldowns };
    },
    { initialData: initial },
  );

  if (status === "loading") return <MonetizacionScreenLoading cards={6} columns={2} />;
  if (status === "error") return <MonetizacionScreenError onRetry={retry} />;
  if (!data) return null;

  return (
    <MonetizacionMetricasDealerClient metrics={data.metrics} drilldowns={data.drilldowns} />
  );
}

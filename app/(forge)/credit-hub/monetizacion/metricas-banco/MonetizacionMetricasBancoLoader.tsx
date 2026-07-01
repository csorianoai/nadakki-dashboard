"use client";

import { fetchBankMetrics, fetchDrilldowns } from "@/lib/credit-hub/monetizacion/adapter";
import type { BankMetrics, DrilldownMap } from "@/lib/credit-hub/monetizacion/types";
import { useMonetizacionQuery } from "@/lib/credit-hub/monetizacion/useMonetizacionQuery";
import {
  MonetizacionScreenError,
  MonetizacionScreenLoading,
} from "@/components/credit-hub/monetizacion/ui/MonetizacionScreenState";
import { MonetizacionMetricasBancoClient } from "./MonetizacionMetricasBancoClient";

type Initial = { metrics: BankMetrics | null; drilldowns: DrilldownMap };

export function MonetizacionMetricasBancoLoader({ initial }: { initial?: Initial }) {
  const { data, status, retry } = useMonetizacionQuery(
    async () => {
      const [metrics, drilldowns] = await Promise.all([
        fetchBankMetrics("banco-cibao"),
        fetchDrilldowns(),
      ]);
      return { metrics, drilldowns };
    },
    { initialData: initial },
  );

  if (status === "loading") return <MonetizacionScreenLoading cards={6} columns={3} />;
  if (status === "error") return <MonetizacionScreenError onRetry={retry} />;
  if (!data) return null;

  return <MonetizacionMetricasBancoClient metrics={data.metrics} drilldowns={data.drilldowns} />;
}

"use client";

import { fetchDealerMetrics } from "@/lib/credit-hub/monetizacion/adapter";
import type { DealerMetrics } from "@/lib/credit-hub/monetizacion/types";
import { useMonetizacionQuery } from "@/lib/credit-hub/monetizacion/useMonetizacionQuery";
import {
  MonetizacionScreenError,
  MonetizacionScreenLoading,
} from "@/components/credit-hub/monetizacion/ui/MonetizacionScreenState";
import { MonetizacionMetricasDealerClient } from "./MonetizacionMetricasDealerClient";

export function MonetizacionMetricasDealerLoader({ initialMetrics }: { initialMetrics?: DealerMetrics | null }) {
  const { data, status, retry } = useMonetizacionQuery(
    async () => fetchDealerMetrics("auto-credito-cibao"),
    { initialData: initialMetrics },
  );

  if (status === "loading") return <MonetizacionScreenLoading cards={6} columns={2} />;
  if (status === "error") return <MonetizacionScreenError onRetry={retry} />;

  return <MonetizacionMetricasDealerClient metrics={data ?? null} />;
}

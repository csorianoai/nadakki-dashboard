"use client";

import { fetchDrilldowns, fetchRevenueAnalytics } from "@/lib/credit-hub/monetizacion/adapter";
import type { DrilldownMap, RevenueAnalytics } from "@/lib/credit-hub/monetizacion/types";
import { useMonetizacionQuery } from "@/lib/credit-hub/monetizacion/useMonetizacionQuery";
import {
  MonetizacionScreenError,
  MonetizacionScreenLoading,
} from "@/components/credit-hub/monetizacion/ui/MonetizacionScreenState";
import { MonetizacionIngresosClient } from "./MonetizacionIngresosClient";

type Initial = { revenue: RevenueAnalytics; drilldowns: DrilldownMap };

export function MonetizacionIngresosLoader({ initial }: { initial?: Initial }) {
  const { data, status, retry } = useMonetizacionQuery(
    async () => {
      const [revenue, drilldowns] = await Promise.all([fetchRevenueAnalytics(), fetchDrilldowns()]);
      return { revenue, drilldowns };
    },
    { initialData: initial },
  );

  if (status === "loading") return <MonetizacionScreenLoading cards={6} columns={2} />;
  if (status === "error") return <MonetizacionScreenError onRetry={retry} />;
  if (!data) return null;

  return <MonetizacionIngresosClient revenue={data.revenue} drilldowns={data.drilldowns} />;
}

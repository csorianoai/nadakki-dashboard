"use client";

import { fetchCostMargin, fetchDrilldowns } from "@/lib/credit-hub/monetizacion/adapter";
import type { CostMargin, DrilldownMap } from "@/lib/credit-hub/monetizacion/types";
import { useMonetizacionQuery } from "@/lib/credit-hub/monetizacion/useMonetizacionQuery";
import {
  MonetizacionScreenError,
  MonetizacionScreenLoading,
} from "@/components/credit-hub/monetizacion/ui/MonetizacionScreenState";
import { MonetizacionCostoMargenClient } from "./MonetizacionCostoMargenClient";

type Initial = { costMargin: CostMargin; drilldowns: DrilldownMap };

export function MonetizacionCostoMargenLoader({ initial }: { initial?: Initial }) {
  const { data, status, retry } = useMonetizacionQuery(
    async () => {
      const [costMargin, drilldowns] = await Promise.all([fetchCostMargin(), fetchDrilldowns()]);
      return { costMargin, drilldowns };
    },
    { initialData: initial },
  );

  if (status === "loading") return <MonetizacionScreenLoading cards={4} columns={2} />;
  if (status === "error") return <MonetizacionScreenError onRetry={retry} />;
  if (!data) return null;

  return <MonetizacionCostoMargenClient costMargin={data.costMargin} drilldowns={data.drilldowns} />;
}

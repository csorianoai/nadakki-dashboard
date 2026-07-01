"use client";

import { fetchDrilldowns, fetchReconciliation } from "@/lib/credit-hub/monetizacion/adapter";
import type { DrilldownMap, Reconciliation } from "@/lib/credit-hub/monetizacion/types";
import { useMonetizacionQuery } from "@/lib/credit-hub/monetizacion/useMonetizacionQuery";
import {
  MonetizacionScreenError,
  MonetizacionScreenLoading,
} from "@/components/credit-hub/monetizacion/ui/MonetizacionScreenState";
import { MonetizacionReconciliacionClient } from "./MonetizacionReconciliacionClient";

type Initial = { reconciliation: Reconciliation; drilldowns: DrilldownMap };

export function MonetizacionReconciliacionLoader({ initial }: { initial?: Initial }) {
  const { data, status, retry } = useMonetizacionQuery(
    async () => {
      const [reconciliation, drilldowns] = await Promise.all([
        fetchReconciliation(),
        fetchDrilldowns(),
      ]);
      return { reconciliation, drilldowns };
    },
    { initialData: initial },
  );

  if (status === "loading") return <MonetizacionScreenLoading cards={4} columns={4} />;
  if (status === "error") return <MonetizacionScreenError onRetry={retry} />;
  if (!data) return null;

  return (
    <MonetizacionReconciliacionClient
      reconciliation={data.reconciliation}
      drilldowns={data.drilldowns}
    />
  );
}

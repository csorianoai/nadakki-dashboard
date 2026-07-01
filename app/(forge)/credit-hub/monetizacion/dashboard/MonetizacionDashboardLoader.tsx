"use client";

import { toast } from "sonner";
import { fetchDashboardKpis, fetchDrilldowns } from "@/lib/credit-hub/monetizacion/adapter";
import type { DashboardKPIs, DrilldownMap } from "@/lib/credit-hub/monetizacion/types";
import { useMonetizacionQuery } from "@/lib/credit-hub/monetizacion/useMonetizacionQuery";
import {
  MonetizacionScreenEmpty,
  MonetizacionScreenError,
  MonetizacionScreenLoading,
} from "@/components/credit-hub/monetizacion/ui/MonetizacionScreenState";
import { MonetizacionDashboardClient } from "./MonetizacionDashboardClient";

type Initial = { kpis: DashboardKPIs; drilldowns: DrilldownMap };

export function MonetizacionDashboardLoader({ initial }: { initial?: Initial }) {
  const { data, status, retry } = useMonetizacionQuery(
    async () => {
      const [kpis, drilldowns] = await Promise.all([fetchDashboardKpis(), fetchDrilldowns()]);
      return { kpis, drilldowns };
    },
    { initialData: initial },
  );

  if (status === "loading") return <MonetizacionScreenLoading cards={8} columns={4} />;
  if (status === "error") return <MonetizacionScreenError onRetry={retry} />;
  if (!data) return null;

  if (data.kpis.tape.length === 0) {
    return (
      <MonetizacionScreenEmpty
        message="Sin eventos facturables en mayo 2026. Cuando se fundee el primer préstamo, aparecerá aquí."
        ctaLabel="Ver periodo anterior"
        onCta={() => toast.info("Periodo anterior · demo")}
      />
    );
  }

  return <MonetizacionDashboardClient initialKpis={data.kpis} drilldowns={data.drilldowns} />;
}

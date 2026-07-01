"use client";

import { toast } from "sonner";
import { fetchDrilldowns, fetchInvoice } from "@/lib/credit-hub/monetizacion/adapter";
import type { DrilldownMap, Invoice } from "@/lib/credit-hub/monetizacion/types";
import { useMonetizacionQuery } from "@/lib/credit-hub/monetizacion/useMonetizacionQuery";
import {
  MonetizacionScreenEmpty,
  MonetizacionScreenError,
  MonetizacionScreenLoading,
} from "@/components/credit-hub/monetizacion/ui/MonetizacionScreenState";
import { MonetizacionFacturaClient } from "./MonetizacionFacturaClient";

type Initial = { invoice: Invoice; drilldowns: DrilldownMap };

export function MonetizacionFacturaLoader({ initial }: { initial?: Initial }) {
  const { data, status, retry } = useMonetizacionQuery(
    async () => {
      const [invoice, drilldowns] = await Promise.all([fetchInvoice(), fetchDrilldowns()]);
      return { invoice, drilldowns };
    },
    { initialData: initial },
  );

  if (status === "loading") return <MonetizacionScreenLoading cards={4} columns={2} />;
  if (status === "error") return <MonetizacionScreenError onRetry={retry} />;
  if (!data) return null;

  if (data.invoice.lines.length === 0) {
    return (
      <MonetizacionScreenEmpty
        message="Sin eventos facturables en mayo 2026. Cuando se fundee el primer préstamo, aparecerá aquí."
        ctaLabel="Ver periodo anterior"
        onCta={() => toast.info("Periodo anterior · demo")}
      />
    );
  }

  return <MonetizacionFacturaClient invoice={data.invoice} drilldowns={data.drilldowns} />;
}

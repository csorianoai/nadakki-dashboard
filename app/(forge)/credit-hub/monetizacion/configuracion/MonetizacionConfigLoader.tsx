"use client";

import { fetchBillingConfig } from "@/lib/credit-hub/monetizacion/adapter";
import type { BillingConfig } from "@/lib/credit-hub/monetizacion/types";
import { useMonetizacionQuery } from "@/lib/credit-hub/monetizacion/useMonetizacionQuery";
import {
  MonetizacionScreenError,
  MonetizacionScreenLoading,
} from "@/components/credit-hub/monetizacion/ui/MonetizacionScreenState";
import { MonetizacionConfigClient } from "./MonetizacionConfigClient";

export function MonetizacionConfigLoader({ initialConfig }: { initialConfig?: BillingConfig }) {
  const { data, status, retry } = useMonetizacionQuery(
    async () => fetchBillingConfig(),
    { initialData: initialConfig },
  );

  if (status === "loading") return <MonetizacionScreenLoading cards={6} columns={3} />;
  if (status === "error") return <MonetizacionScreenError onRetry={retry} />;
  if (!data) return null;

  return <MonetizacionConfigClient initialConfig={data} />;
}

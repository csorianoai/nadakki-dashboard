"use client";

import { useMonetizacionQuery } from "@/lib/credit-hub/monetizacion/useMonetizacionQuery";
import {
  MonetizacionScreenError,
  MonetizacionScreenLoading,
} from "@/components/credit-hub/monetizacion/ui/MonetizacionScreenState";
import { MonetizacionScreenPlaceholder } from "../_shared/MonetizacionScreenPlaceholder";

export function MonetizacionIngresosLoader({ initialReady }: { initialReady?: boolean }) {
  const { status, retry } = useMonetizacionQuery(
    async () => true,
    { initialData: initialReady },
  );

  if (status === "loading") return <MonetizacionScreenLoading cards={4} columns={2} />;
  if (status === "error") return <MonetizacionScreenError onRetry={retry} />;

  return <MonetizacionScreenPlaceholder screen="P2 · Ingresos" />;
}

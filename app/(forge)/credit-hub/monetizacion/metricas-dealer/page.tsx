import { fetchDealerMetrics } from "@/lib/credit-hub/monetizacion/adapter";
import { MonetizacionMetricasDealerClient } from "./MonetizacionMetricasDealerClient";

export default async function MonetizacionMetricasDealerPage() {
  const metrics = await fetchDealerMetrics("auto-credito-cibao");
  return <MonetizacionMetricasDealerClient metrics={metrics} />;
}

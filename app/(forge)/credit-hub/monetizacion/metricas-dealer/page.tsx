import { fetchDealerMetrics } from "@/lib/credit-hub/monetizacion/adapter";
import { MonetizacionMetricasDealerLoader } from "./MonetizacionMetricasDealerLoader";

export default async function MonetizacionMetricasDealerPage() {
  try {
    const metrics = await fetchDealerMetrics("auto-credito-cibao");
    return <MonetizacionMetricasDealerLoader initialMetrics={metrics} />;
  } catch {
    return <MonetizacionMetricasDealerLoader />;
  }
}

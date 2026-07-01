import { fetchDealerMetrics, fetchDrilldowns } from "@/lib/credit-hub/monetizacion/adapter";
import { MonetizacionMetricasDealerLoader } from "./MonetizacionMetricasDealerLoader";

export default async function MonetizacionMetricasDealerPage() {
  try {
    const [metrics, drilldowns] = await Promise.all([
      fetchDealerMetrics("auto-credito-cibao"),
      fetchDrilldowns(),
    ]);
    return <MonetizacionMetricasDealerLoader initial={{ metrics, drilldowns }} />;
  } catch {
    return <MonetizacionMetricasDealerLoader />;
  }
}

import { fetchBankMetrics, fetchDrilldowns } from "@/lib/credit-hub/monetizacion/adapter";
import { MonetizacionMetricasBancoLoader } from "./MonetizacionMetricasBancoLoader";

export default async function MonetizacionMetricasBancoPage() {
  try {
    const [metrics, drilldowns] = await Promise.all([
      fetchBankMetrics("banco-cibao"),
      fetchDrilldowns(),
    ]);
    return <MonetizacionMetricasBancoLoader initial={{ metrics, drilldowns }} />;
  } catch {
    return <MonetizacionMetricasBancoLoader />;
  }
}

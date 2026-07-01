import { fetchBankMetrics, fetchDrilldowns } from "@/lib/credit-hub/monetizacion/adapter";
import { MonetizacionMetricasBancoClient } from "./MonetizacionMetricasBancoClient";

export default async function MonetizacionMetricasBancoPage() {
  const tenantId = "banco-cibao";
  const [metrics, drilldowns] = await Promise.all([
    fetchBankMetrics(tenantId),
    fetchDrilldowns(),
  ]);
  return <MonetizacionMetricasBancoClient metrics={metrics} drilldowns={drilldowns} />;
}

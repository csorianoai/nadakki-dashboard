import { fetchDrilldowns, fetchReconciliation } from "@/lib/credit-hub/monetizacion/adapter";
import { MonetizacionReconciliacionClient } from "./MonetizacionReconciliacionClient";

export default async function MonetizacionReconciliacionPage() {
  const [reconciliation, drilldowns] = await Promise.all([fetchReconciliation(), fetchDrilldowns()]);
  return <MonetizacionReconciliacionClient reconciliation={reconciliation} drilldowns={drilldowns} />;
}

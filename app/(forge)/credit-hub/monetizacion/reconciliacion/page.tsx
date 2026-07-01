import { fetchDrilldowns, fetchReconciliation } from "@/lib/credit-hub/monetizacion/adapter";
import { MonetizacionReconciliacionLoader } from "./MonetizacionReconciliacionLoader";

export default async function MonetizacionReconciliacionPage() {
  try {
    const [reconciliation, drilldowns] = await Promise.all([
      fetchReconciliation(),
      fetchDrilldowns(),
    ]);
    return <MonetizacionReconciliacionLoader initial={{ reconciliation, drilldowns }} />;
  } catch {
    return <MonetizacionReconciliacionLoader />;
  }
}

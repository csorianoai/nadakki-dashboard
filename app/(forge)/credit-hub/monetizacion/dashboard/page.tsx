import { fetchDashboardKpis, fetchDrilldowns } from "@/lib/credit-hub/monetizacion/adapter";
import { MonetizacionDashboardClient } from "./MonetizacionDashboardClient";

export default async function MonetizacionDashboardPage() {
  const [initialKpis, drilldowns] = await Promise.all([fetchDashboardKpis(), fetchDrilldowns()]);
  return <MonetizacionDashboardClient initialKpis={initialKpis} drilldowns={drilldowns} />;
}

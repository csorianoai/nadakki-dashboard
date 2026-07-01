import { fetchDashboardKpis, fetchDrilldowns } from "@/lib/credit-hub/monetizacion/adapter";
import { MonetizacionDashboardLoader } from "./MonetizacionDashboardLoader";

export default async function MonetizacionDashboardPage() {
  try {
    const [kpis, drilldowns] = await Promise.all([fetchDashboardKpis(), fetchDrilldowns()]);
    return <MonetizacionDashboardLoader initial={{ kpis, drilldowns }} />;
  } catch {
    return <MonetizacionDashboardLoader />;
  }
}

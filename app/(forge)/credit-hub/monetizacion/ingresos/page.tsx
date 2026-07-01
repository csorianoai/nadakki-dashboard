import { fetchDrilldowns, fetchRevenueAnalytics } from "@/lib/credit-hub/monetizacion/adapter";
import { MonetizacionIngresosLoader } from "./MonetizacionIngresosLoader";

export default async function MonetizacionIngresosPage() {
  try {
    const [revenue, drilldowns] = await Promise.all([fetchRevenueAnalytics(), fetchDrilldowns()]);
    return <MonetizacionIngresosLoader initial={{ revenue, drilldowns }} />;
  } catch {
    return <MonetizacionIngresosLoader />;
  }
}

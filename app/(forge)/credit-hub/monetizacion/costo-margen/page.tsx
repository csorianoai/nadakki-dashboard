import { fetchCostMargin, fetchDrilldowns } from "@/lib/credit-hub/monetizacion/adapter";
import { MonetizacionCostoMargenLoader } from "./MonetizacionCostoMargenLoader";

export default async function MonetizacionCostoMargenPage() {
  try {
    const [costMargin, drilldowns] = await Promise.all([fetchCostMargin(), fetchDrilldowns()]);
    return <MonetizacionCostoMargenLoader initial={{ costMargin, drilldowns }} />;
  } catch {
    return <MonetizacionCostoMargenLoader />;
  }
}

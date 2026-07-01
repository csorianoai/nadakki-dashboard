import { fetchDrilldowns, fetchInvoice } from "@/lib/credit-hub/monetizacion/adapter";
import { MonetizacionFacturaLoader } from "./MonetizacionFacturaLoader";

export default async function MonetizacionEstadoCuentaPage() {
  try {
    const [invoice, drilldowns] = await Promise.all([fetchInvoice(), fetchDrilldowns()]);
    return <MonetizacionFacturaLoader initial={{ invoice, drilldowns }} />;
  } catch {
    return <MonetizacionFacturaLoader />;
  }
}

import { fetchDrilldowns, fetchInvoice } from "@/lib/credit-hub/monetizacion/adapter";
import { MonetizacionFacturaClient } from "./MonetizacionFacturaClient";

export default async function MonetizacionEstadoCuentaPage() {
  const [invoice, drilldowns] = await Promise.all([fetchInvoice(), fetchDrilldowns()]);
  return <MonetizacionFacturaClient invoice={invoice} drilldowns={drilldowns} />;
}

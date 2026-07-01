import { fetchBillingConfig } from "@/lib/credit-hub/monetizacion/adapter";
import { MonetizacionConfigClient } from "./MonetizacionConfigClient";

export default async function MonetizacionConfiguracionPage() {
  const initialConfig = await fetchBillingConfig();
  return <MonetizacionConfigClient initialConfig={initialConfig} />;
}

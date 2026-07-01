import { fetchBillingConfig } from "@/lib/credit-hub/monetizacion/adapter";
import { MonetizacionConfigLoader } from "./MonetizacionConfigLoader";

export default async function MonetizacionConfiguracionPage() {
  try {
    const initialConfig = await fetchBillingConfig();
    return <MonetizacionConfigLoader initialConfig={initialConfig} />;
  } catch {
    return <MonetizacionConfigLoader />;
  }
}

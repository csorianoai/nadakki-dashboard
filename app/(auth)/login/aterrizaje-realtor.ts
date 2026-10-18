import { fetchPanelAccessStatus } from "@/lib/realtor/access";
import { isPanelFlagOn } from "@/lib/realtor/config";

export const DEALER_HOME = "/autos/dealer";
export const REALTOR_HOME = "/realtor";

/** Solo el aterrizaje de dealer se consulta: el resto de roles conserva su destino y su ruta síncrona. */
export function debeProbarRealtor(destino: string): boolean {
  return destino === DEALER_HOME && isPanelFlagOn();
}

/**
 * La puerta de Real Estate manda sobre el claim `role`: con 200 de /acceso el destino es /realtor aunque el rol sea dealer;
 * con 401/403/404 o error de red queda el destino por rol (fail-closed hacia el mapa actual).
 */
export async function aterrizajeRealtor(destino: string): Promise<string> {
  return (await fetchPanelAccessStatus()) === "ok" ? REALTOR_HOME : destino;
}

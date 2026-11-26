import { resolveDealerAdminHost } from "@/lib/dealer-management/admin-host";

/**
 * Host del portal publico de un concesionario (mapaal.nadakki.com, qa-dealer-nadakki.nadakki.com).
 *
 * Reusa la misma regla que el login (`resolveDealerAdminHost`, modo `dealer_subdomain`): un subdominio de un nivel
 * de nadakki.com que no esta reservado. Quedan fuera los hosts de la app: dashboard.nadakki.com, autos.nadakki.com,
 * www/api/status/staging-dashboard, el propio nadakki.com, las previews *.vercel.app y localhost.
 */
export function portalRequestHost(headers: Headers): string {
  return (headers.get("x-forwarded-host") || headers.get("host") || "")
    .split(",")[0]
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, "");
}

export function isDealerPortalHost(host: string): boolean {
  if (!host) return false;
  return resolveDealerAdminHost(host.replace(/:\d+$/, "")).mode === "dealer_subdomain";
}

/** Destino de la portada en un host de portal: el inventario real del concesionario. */
export const DEALER_PORTAL_HOME = "/autos/vehiculos";

/**
 * Ruta a la que se manda la portada en un host de portal, o null si no aplica.
 *
 * - `/autos` (vitrina generica de marketplace): siempre, tambien en navegacion del cliente (los enlaces del portal
 *   apuntan ahi).
 * - `/`: solo en peticion de documento. Una navegacion del cliente (cabecera `RSC`) a `/` es la del login cuando el
 *   rol aterriza en `/` (tenant_admin); se deja pasar para no romper ese aterrizaje.
 */
export function dealerPortalHomeRedirect(host: string, pathname: string, headers: Headers): string | null {
  if (pathname !== "/" && pathname !== "/autos") return null;
  if (!isDealerPortalHost(host)) return null;
  if (pathname === "/" && headers.get("rsc")) return null;
  return DEALER_PORTAL_HOME;
}

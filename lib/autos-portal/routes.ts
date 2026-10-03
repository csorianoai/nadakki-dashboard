/** Canonical Autos Portal routes (Option A — consumer /autos/*). */

export const AUTOS_CANONICAL_ROUTES = {
  home: "/autos",
  browse: "/autos/vehiculos",
  vehicleDetail: (id: string) => `/autos/vehiculo/${encodeURIComponent(id)}`,
  cart: "/autos/cart",
  compare: "/autos/compare",
  misLeads: "/autos/dashboard/mis-leads",
  admin: "/admin/autos",
} as const;

/** Legacy Forge paths redirected to browse (301 via middleware). */
export const AUTOS_LEGACY_MARKETPLACE_PREFIX = "/autos/marketplace";

export function legacyMarketplaceRedirectTarget(pathname: string): string {
  const base = AUTOS_CANONICAL_ROUTES.browse;
  if (pathname === AUTOS_LEGACY_MARKETPLACE_PREFIX) return base;
  return `${base}?ref=legacy_marketplace`;
}

/** Raiz del panel privado del dealer (Nadakki Dealer Management). */
export const DEALER_MANAGEMENT_ROOT = "/autos/dealer";

/**
 * Panel del dealer: autenticado, pero con su propio chrome (DealerShell).
 *
 * No es publico —sigue exigiendo ProtectedRoute— pero queda fuera del
 * GlobalForgeAppShell y de la barra del marketplace, que son las otras dos
 * navegaciones que se solapaban aqui antes de F2.
 */
export function isDealerManagementPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname === DEALER_MANAGEMENT_ROOT || pathname.startsWith(`${DEALER_MANAGEMENT_ROOT}/`);
}

/** Centro Operativo: la guia de carga y operacion del dealer (D9). */
export const CENTRO_OPERATIVO_ROOT = "/centro-operativo";

/**
 * Rutas que se pintan con el chrome del dealer (`DealerShell`).
 *
 * Es el panel del dealer MAS el Centro Operativo. Decision de Cesar: el
 * onboarding de Mapaal se lee dentro del panel, no en `GlobalForgeAppShell`,
 * que es el chrome de la Suite con la barra de todos los hubs. Un dealer que
 * entra a la guia desde su Inicio no deberia cambiar de mundo al pulsar el
 * boton, ni perder el menu desde el que vino.
 *
 * Separada de {@link isDealerManagementPath} a proposito: esa sigue
 * significando "el panel privado del dealer bajo /autos/dealer" --su prefijo,
 * su test-- y el Centro Operativo no vive ahi. Lo que comparten es el chrome,
 * no la raiz, y eso es exactamente lo que nombra esta funcion.
 */
export function isDealerChromePath(pathname: string | null): boolean {
  if (!pathname) return false;
  if (isDealerManagementPath(pathname)) return true;
  return (
    pathname === CENTRO_OPERATIVO_ROOT || pathname.startsWith(`${CENTRO_OPERATIVO_ROOT}/`)
  );
}

/** Consumer-facing Autos Portal paths that must stay public on autos.nadakki.com. */
export function isAutosConsumerPublicPath(pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname === AUTOS_CANONICAL_ROUTES.home) return true;
  if (pathname === AUTOS_CANONICAL_ROUTES.browse || pathname.startsWith(`${AUTOS_CANONICAL_ROUTES.browse}/`)) {
    return true;
  }
  if (pathname.startsWith("/autos/vehiculo/")) return true;
  if (pathname === AUTOS_CANONICAL_ROUTES.cart) return true;
  if (pathname === AUTOS_CANONICAL_ROUTES.compare) return true;
  if (
    pathname === AUTOS_CANONICAL_ROUTES.misLeads ||
    pathname.startsWith(`${AUTOS_CANONICAL_ROUTES.misLeads}/`)
  ) {
    return true;
  }
  if (pathname === "/autos/mi-shopper" || pathname.startsWith("/autos/mi-shopper/")) {
    return true;
  }
  return false;
}

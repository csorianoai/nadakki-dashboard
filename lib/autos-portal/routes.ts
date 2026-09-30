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

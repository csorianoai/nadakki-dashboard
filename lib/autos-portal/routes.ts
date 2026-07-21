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

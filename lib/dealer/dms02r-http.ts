/**
 * Authenticated DMS-02R HTTP from backend PR #1365 (OPEN).
 * Production OpenAPI (957 paths) does not publish these GET routes.
 * GET /api/v1/autos/vehicles/{vehicle_id} is the public marketplace listing
 * (RLS public_read) and is not a dealer source.
 */
export const DMS02R_HTTP_PREFIX = "/api/v1/autos";

export const PUBLIC_MARKETPLACE_VEHICLE_PATH = `${DMS02R_HTTP_PREFIX}/vehicles/{vehicle_id}`;

export const DMS02R_AUTHENTICATED_GET_PATHS = {
  dealerVehicle: `${DMS02R_HTTP_PREFIX}/tenants/{tenant_id}/dealers/{dealer_id}/vehicles/{vehicle_id}`,
  margin: `${DMS02R_HTTP_PREFIX}/vehicles/{vehicle_id}/margin`,
  days: `${DMS02R_HTTP_PREFIX}/vehicles/{vehicle_id}/days`,
  costs: `${DMS02R_HTTP_PREFIX}/vehicles/{vehicle_id}/costs`,
} as const;

/** Measured against https://api.nadakki.com/openapi.json (957 paths). */
export const DMS02R_HTTP_IN_PRODUCTION_OPENAPI = false;

/** @deprecated Use DMS02R_AUTHENTICATED_GET_PATHS. Kept only as alias for tests. */
export const DMS02R_ECONOMICS_PATHS = {
  margin: DMS02R_AUTHENTICATED_GET_PATHS.margin,
  days: DMS02R_AUTHENTICATED_GET_PATHS.days,
  costs: DMS02R_AUTHENTICATED_GET_PATHS.costs,
} as const;

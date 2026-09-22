/**
 * DMS-02R HTTP from backend PR #1365 (OPEN). Production OpenAPI (957 paths)
 * does not publish these GET/POST routes yet. The dealer screen must not call them.
 */
export const DMS02R_HTTP_PREFIX = "/api/v1/autos";

export const DMS02R_ECONOMICS_PATHS = {
  margin: `${DMS02R_HTTP_PREFIX}/vehicles/{vehicle_id}/margin`,
  days: `${DMS02R_HTTP_PREFIX}/vehicles/{vehicle_id}/days`,
  costs: `${DMS02R_HTTP_PREFIX}/vehicles/{vehicle_id}/costs`,
} as const;

/** Measured against https://api.nadakki.com/openapi.json (957 paths). */
export const DMS02R_HTTP_IN_PRODUCTION_OPENAPI = false;

export const VEHICLE_DETAIL_PATH = `${DMS02R_HTTP_PREFIX}/vehicles/{vehicle_id}`;

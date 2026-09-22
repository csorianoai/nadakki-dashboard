/**
 * Ficha autenticada C2: GET /api/v1/autos/dealers/{dealer_id}/vehicles/{vehicle_id}.
 * Economía DMS-02R HTTP (#1365) sigue ausente del OpenAPI de producción.
 * GET /api/v1/autos/vehicles/{vehicle_id} es vitrina pública — no es fuente dealer.
 */
export const DMS02R_HTTP_PREFIX = "/api/v1/autos";

export const PUBLIC_MARKETPLACE_VEHICLE_PATH = `${DMS02R_HTTP_PREFIX}/vehicles/{vehicle_id}`;

export const DEALER_VEHICLE_GET_PATH = `${DMS02R_HTTP_PREFIX}/dealers/{dealer_id}/vehicles/{vehicle_id}`;

export const DMS02R_AUTHENTICATED_GET_PATHS = {
  dealerVehicle: DEALER_VEHICLE_GET_PATH,
  margin: `${DMS02R_HTTP_PREFIX}/vehicles/{vehicle_id}/margin`,
  days: `${DMS02R_HTTP_PREFIX}/vehicles/{vehicle_id}/days`,
  costs: `${DMS02R_HTTP_PREFIX}/vehicles/{vehicle_id}/costs`,
} as const;

/** Economics GET/POST from #1365 — still unpublished on production OpenAPI. */
export const DMS02R_HTTP_IN_PRODUCTION_OPENAPI = false;

export const DMS02R_ECONOMICS_PATHS = {
  margin: DMS02R_AUTHENTICATED_GET_PATHS.margin,
  days: DMS02R_AUTHENTICATED_GET_PATHS.days,
  costs: DMS02R_AUTHENTICATED_GET_PATHS.costs,
} as const;

export function dealerVehicleGetUrl(dealerId: string, vehicleId: string): string {
  return `${DMS02R_HTTP_PREFIX}/dealers/${encodeURIComponent(dealerId)}/vehicles/${encodeURIComponent(vehicleId)}`;
}

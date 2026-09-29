/**
 * Ficha autenticada C2: GET /api/v1/autos/dealers/{dealer_id}/vehicles/{vehicle_id}.
 * Economía DMS-02R HTTP (#1365) YA está publicada en el OpenAPI de producción.
 * GET /api/v1/autos/vehicles/{vehicle_id} es vitrina pública — no es fuente dealer.
 */
export const DMS02R_HTTP_PREFIX = "/api/v1/autos";

export const PUBLIC_MARKETPLACE_VEHICLE_PATH = `${DMS02R_HTTP_PREFIX}/vehicles/{vehicle_id}`;

export const DEALER_VEHICLE_GET_PATH = `${DMS02R_HTTP_PREFIX}/dealers/{dealer_id}/vehicles/{vehicle_id}`;

/** Rutas con lector GET declarado en el OpenAPI de producción (medido 29-sep-2026). */
export const DMS02R_AUTHENTICATED_GET_PATHS = {
  dealerVehicle: DEALER_VEHICLE_GET_PATH,
  margin: `${DMS02R_HTTP_PREFIX}/vehicles/{vehicle_id}/margin`,
  days: `${DMS02R_HTTP_PREFIX}/vehicles/{vehicle_id}/days`,
} as const;

/**
 * Rutas de escritura sin lector GET. `costs` es la deuda AUTOS-VEHICLE-COSTS-READER-01:
 * hay writer (POST) pero GET responde 405, así que el costo real por vehículo no se puede
 * leer todavía. El frontend muestra "no disponible aún"; nunca lo calcula.
 */
export const DMS02R_WRITE_ONLY_PATHS = {
  costs: `${DMS02R_HTTP_PREFIX}/vehicles/{vehicle_id}/costs`,
  acquisition: `${DMS02R_HTTP_PREFIX}/vehicles/{vehicle_id}/acquisition`,
  sale: `${DMS02R_HTTP_PREFIX}/vehicles/{vehicle_id}/sale`,
} as const;

/** Economics GET/POST from #1365 — published on production OpenAPI since v5.4.4. */
export const DMS02R_HTTP_IN_PRODUCTION_OPENAPI = true;

/** `costs` sigue aquí como superficie de economía; su lector GET no existe (ver arriba). */
export const DMS02R_ECONOMICS_PATHS = {
  margin: DMS02R_AUTHENTICATED_GET_PATHS.margin,
  days: DMS02R_AUTHENTICATED_GET_PATHS.days,
  costs: DMS02R_WRITE_ONLY_PATHS.costs,
} as const;

export function dealerVehicleGetUrl(dealerId: string, vehicleId: string): string {
  return `${DMS02R_HTTP_PREFIX}/dealers/${encodeURIComponent(dealerId)}/vehicles/${encodeURIComponent(vehicleId)}`;
}

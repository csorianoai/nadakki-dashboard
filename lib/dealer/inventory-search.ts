/**
 * Authenticated dealer inventory. Production OpenAPI has POST create and
 * PATCH on /tenants/{tenant_id}/dealers/{dealer_id}/vehicles, but GET (all
 * statuses) is unpublished. POST /api/v1/autos/vehicles/search is the public
 * marketplace vitrine and is not a dealer source.
 */

export const DEALER_INVENTORY_LIST_PATH =
  "/api/v1/autos/tenants/{tenant_id}/dealers/{dealer_id}/vehicles";

export const PUBLIC_MARKETPLACE_SEARCH_PATH = "/api/v1/autos/vehicles/search";

/** Measured against production OpenAPI: get?: never on the dealer collection. */
export const DEALER_INVENTORY_LIST_GET_IN_PRODUCTION_OPENAPI = false;

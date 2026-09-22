/**
 * @jest-environment jsdom
 */

import {
  DEALER_INVENTORY_LIST_GET_IN_PRODUCTION_OPENAPI,
  DEALER_INVENTORY_LIST_PATH,
  PUBLIC_MARKETPLACE_SEARCH_PATH,
} from "@/lib/dealer/inventory-search";

describe("dealer inventory contract", () => {
  test("does not treat public marketplace search as dealer inventory", () => {
    expect(DEALER_INVENTORY_LIST_GET_IN_PRODUCTION_OPENAPI).toBe(false);
    expect(DEALER_INVENTORY_LIST_PATH).toBe(
      "/api/v1/autos/tenants/{tenant_id}/dealers/{dealer_id}/vehicles",
    );
    expect(PUBLIC_MARKETPLACE_SEARCH_PATH).toBe("/api/v1/autos/vehicles/search");
  });
});

/**
 * @jest-environment jsdom
 */

jest.mock("@/lib/auth/token-refresh", () => ({
  refreshAccessToken: jest.fn(async () => false),
  isTokenExpiringSoon: jest.fn(() => false),
}));

import {
  parseDealerInventoryRow,
  DEALER_INVENTORY_SEARCH_PATH,
} from "@/lib/dealer/inventory-search";

describe("dealer inventory parse", () => {
  test("keeps only the matching tenant and dealer", () => {
    const mine = parseDealerInventoryRow(
      {
        id: "v-1",
        tenant_id: "tenant-a",
        dealer_id: "dealer-a",
        make: "Toyota",
        model: "Corolla",
        year: 2020,
        status: "disponible",
        price_rd: 890000,
        mileage_km: 12000,
      },
      "tenant-a",
      "dealer-a",
    );
    expect(mine).toEqual({
      id: "v-1",
      make: "Toyota",
      model: "Corolla",
      year: 2020,
      status: "disponible",
      price_rd: 890000,
      mileage_km: 12000,
    });
    expect(
      parseDealerInventoryRow(
        { id: "v-2", tenant_id: "tenant-a", dealer_id: "dealer-b", make: "Honda" },
        "tenant-a",
        "dealer-a",
      ),
    ).toBeNull();
    expect(
      parseDealerInventoryRow(
        { id: "v-3", tenant_id: "tenant-b", dealer_id: "dealer-a", make: "Kia" },
        "tenant-a",
        "dealer-a",
      ),
    ).toBeNull();
  });

  test("drops rows without backend id", () => {
    expect(
      parseDealerInventoryRow(
        { tenant_id: "tenant-a", dealer_id: "dealer-a", make: "Toyota" },
        "tenant-a",
        "dealer-a",
      ),
    ).toBeNull();
  });

  test("search path is the OpenAPI marketplace POST", () => {
    expect(DEALER_INVENTORY_SEARCH_PATH).toBe("/api/v1/autos/vehicles/search");
  });
});

/**
 * @jest-environment jsdom
 */

jest.mock("@/lib/auth/token-refresh", () => ({
  refreshAccessToken: jest.fn(async () => false),
  isTokenExpiringSoon: jest.fn(() => false),
}));

import { parseDealerInventoryRow, DEALER_INVENTORY_LIST_PATH, dealerInventoryListUrl } from "@/lib/dealer/inventory-search";

describe("dealer inventory parse", () => {
  test("keeps all statuses for the matching dealer", () => {
    const sold = parseDealerInventoryRow(
      {
        id: "v-1",
        dealer_id: "dealer-a",
        make: "Toyota",
        model: "Corolla",
        year: 2020,
        status: "vendido",
        price_rd: 890000,
      },
      "dealer-a",
    );
    expect(sold?.status).toBe("vendido");
    expect(
      parseDealerInventoryRow(
        { id: "v-2", dealer_id: "dealer-b", make: "Honda", status: "disponible" },
        "dealer-a",
      ),
    ).toBeNull();
  });

  test("list path is the authenticated dealer GET", () => {
    expect(DEALER_INVENTORY_LIST_PATH).toBe("/api/v1/autos/dealers/{dealer_id}/vehicles");
    expect(dealerInventoryListUrl("dealer-a")).toBe("/api/v1/autos/dealers/dealer-a/vehicles");
  });
});

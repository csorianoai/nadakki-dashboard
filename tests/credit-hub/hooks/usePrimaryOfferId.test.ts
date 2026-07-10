import { pickPrimaryOfferId } from "@/lib/credit-hub/hooks/usePrimaryOfferId";

describe("pickPrimaryOfferId", () => {
  test("prefers counter_offer over approved", () => {
    const id = pickPrimaryOfferId([
      { id: "a", status: "approved" },
      { id: "b", status: "counter_offer" },
    ]);
    expect(id).toBe("b");
  });

  test("falls back to first offer", () => {
    const id = pickPrimaryOfferId([{ id: "z", status: "declined" }]);
    expect(id).toBe("z");
  });
});

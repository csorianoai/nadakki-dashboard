import { extractOfferValidUntil } from "@/components/credit-hub/dealer/OfferValidityBadge";

describe("amortization-conditions F2", () => {
  test("extractOfferValidUntil reads nested terms", () => {
    expect(
      extractOfferValidUntil({
        raw: { terms: { valid_until: "2026-08-01T00:00:00Z" } },
      }),
    ).toBe("2026-08-01T00:00:00Z");
    expect(extractOfferValidUntil({ raw: {} })).toBeNull();
    expect(extractOfferValidUntil({})).toBeNull();
  });
});

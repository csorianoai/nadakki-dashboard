import { normalizeOfferCompareRows } from "@/lib/credit-hub/bank/offer-compare";

describe("offer compare response contract", () => {
  test("reads the real offers_detail array, not a nonexistent offers key", () => {
    const rows = normalizeOfferCompareRows({
      offer_count: 2,
      comparison: [{ field: "amount_approved", values: [] }],
      best: {},
      application_id: "be02eb53",
      offers_detail: [
        { offer_id: "mock-1", lender_code: "mock", terms: { amount_approved: 170000 } },
        { offer_id: "pilot-1", lender_code: "pilot", terms: { amount_approved: 180000 } },
      ],
    });

    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.lender_code)).toEqual(["mock", "pilot"]);
  });
});

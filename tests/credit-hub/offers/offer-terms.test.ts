import { offerHasCompleteTerms } from "@/lib/credit-hub/offers/offer-terms";
import type { CreditOffer } from "@/lib/credit-hub/types/offers";

const baseOffer: CreditOffer = {
  id: "o1",
  application_id: "a1",
  tenant_id: "t1",
  lender_code: "banreservas",
  lender_display_name: null,
  amount_approved: null,
  interest_rate_apr: null,
  term_months: null,
  monthly_payment: null,
  total_cost: null,
  currency: "DOP",
  stipulations: [],
  status: "approved",
  created_at: "2026-01-01T00:00:00.000Z",
  raw: {},
};

describe("offerHasCompleteTerms", () => {
  test("false when any financial field is missing", () => {
    expect(offerHasCompleteTerms(baseOffer)).toBe(false);
  });

  test("true when all required fields are present", () => {
    expect(
      offerHasCompleteTerms({
        ...baseOffer,
        amount_approved: 800_000,
        interest_rate_apr: 0.11,
        term_months: 60,
        monthly_payment: 17_000,
      }),
    ).toBe(true);
  });
});

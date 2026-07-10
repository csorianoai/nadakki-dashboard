import { isCounterOffer, isDealerRejectedOffer } from "@/lib/credit-hub/dealer/offer-actions";
import type { CreditOffer } from "@/lib/credit-hub/types/offers";

function offer(partial: Partial<CreditOffer>): CreditOffer {
  return {
    id: "o1",
    application_id: "a1",
    tenant_id: "t1",
    lender_code: "bank_a",
    lender_display_name: "Bank A",
    amount_approved: 1000,
    interest_rate_apr: 12,
    term_months: 36,
    monthly_payment: 33,
    total_cost: 1200,
    currency: "DOP",
    stipulations: [],
    status: "approved",
    created_at: "2026-01-01",
    raw: {},
    ...partial,
  };
}

describe("offer-actions", () => {
  test("isCounterOffer detects counter_offer status", () => {
    expect(isCounterOffer(offer({ status: "counter_offer" }))).toBe(true);
    expect(isCounterOffer(offer({ status: "approved" }))).toBe(false);
  });

  test("isDealerRejectedOffer reads rejection metadata", () => {
    const rejected = offer({
      status: "not_selected",
      raw: { response_metadata: { rejected_by: "user-1" } },
    });
    expect(isDealerRejectedOffer(rejected)).toBe(true);
  });

  test("isDealerRejectedOffer uses local override set", () => {
    const o = offer({ status: "counter_offer" });
    expect(isDealerRejectedOffer(o, new Set(["o1"]))).toBe(true);
  });
});

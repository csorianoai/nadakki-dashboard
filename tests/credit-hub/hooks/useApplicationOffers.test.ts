import { OFFERS_POLL_MS, offersRefetchInterval } from "@/lib/credit-hub/hooks/useApplicationOffers";

describe("offersRefetchInterval — conditional live polling", () => {
  test("polls every OFFERS_POLL_MS while no offer is accepted (empty list)", () => {
    expect(offersRefetchInterval([])).toBe(OFFERS_POLL_MS);
    expect(offersRefetchInterval(undefined)).toBe(OFFERS_POLL_MS);
  });

  test("keeps polling while offers are still pending/approved/counter_offer", () => {
    expect(
      offersRefetchInterval([{ status: "approved" }, { status: "counter_offer" }]),
    ).toBe(OFFERS_POLL_MS);
  });

  test("stops polling once any offer is accepted (application settled)", () => {
    expect(
      offersRefetchInterval([{ status: "not_selected" }, { status: "accepted" }]),
    ).toBe(false);
  });
});

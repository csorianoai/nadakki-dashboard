import { computeBankFitScore, lenderDisplayName } from "@/lib/credit-hub/dealer/lender-display";

describe("lenderDisplayName", () => {
  it("maps known lender codes", () => {
    expect(lenderDisplayName("banco_popular_dr")).toMatch(/Popular/i);
  });
});

describe("computeBankFitScore", () => {
  it("returns higher score for better approval and speed", () => {
    const high = computeBankFitScore({ approval_rate: 0.8, avg_response_hours: 12, offer_count: 10 });
    const low = computeBankFitScore({ approval_rate: 0.4, avg_response_hours: 48, offer_count: 2 });
    expect(high).toBeGreaterThan(low);
  });
});

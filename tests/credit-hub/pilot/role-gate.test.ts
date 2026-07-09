import { canEscalateReview } from "@/lib/credit-hub/auth/escalate-access";

describe("canEscalateReview role gate", () => {
  it("allows bank_analyst and credit_admin", () => {
    expect(canEscalateReview("bank_analyst")).toBe(true);
    expect(canEscalateReview("credit_admin")).toBe(true);
  });

  it("denies dealer role", () => {
    expect(canEscalateReview("dealer")).toBe(false);
  });
});

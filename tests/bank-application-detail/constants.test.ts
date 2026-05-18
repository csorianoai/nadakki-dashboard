import {
  BANK_ANALYST_ROLE_HEADER,
  DTI_AMBER_MAX,
  OPTIMISTIC_CLAIM_TIMEOUT_MS,
  PTI_GREEN_MAX,
  SLA_RED_HOURS,
} from "@/lib/bank-application-detail/constants";

describe("bank-application-detail constants", () => {
  test("SLA_RED_HOURS and optimistic timeout match v2 tuning", () => {
    expect(SLA_RED_HOURS).toBe(2);
    expect(OPTIMISTIC_CLAIM_TIMEOUT_MS).toBe(3000);
  });

  test("role header and PTI/DTI fallbacks are fixed", () => {
    expect(BANK_ANALYST_ROLE_HEADER).toBe("BANK_ANALYST");
    expect(PTI_GREEN_MAX).toBe(15);
    expect(DTI_AMBER_MAX).toBe(43);
  });
});

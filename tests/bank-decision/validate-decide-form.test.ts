import type { BankDecideRequestBody } from "@/lib/bank-decision/types";
import { requiresAdverseActionPreview, validateDecidePayload } from "@/lib/bank-decision/validate-decide-form";

describe("validate-decide-form", () => {
  test("requiresAdverseActionPreview for REJECT", () => {
    expect(requiresAdverseActionPreview("REJECT", false)).toBe(true);
  });

  test("requiresAdverseActionPreview for COUNTER + no_match", () => {
    expect(requiresAdverseActionPreview("COUNTER", true)).toBe(true);
    expect(requiresAdverseActionPreview("COUNTER", false)).toBe(false);
  });

  test("approve does not require adverse", () => {
    expect(requiresAdverseActionPreview("APPROVE", false)).toBe(false);
  });

  test("approve valid minimal payload when reason ok", () => {
    const b: BankDecideRequestBody = {
      decision_type: "APPROVE",
      reason_codes: ["RC001_APPROVE"],
      adverse_action: false,
    };
    const v = validateDecidePayload(b);
    expect(v.formError).toBeUndefined();
  });

  test("reject fails without adverse_action true", () => {
    const b: BankDecideRequestBody = {
      decision_type: "REJECT",
      reason_codes: ["RC101_REJECT_CREDIT_POLICY"],
      adverse_action: false,
    };
    const v = validateDecidePayload(b);
    expect(v.formError).toBeTruthy();
    expect(v.fieldErrors.adverse_action).toBeTruthy();
  });

  test("reject passes with adverse acknowledgement", () => {
    const b: BankDecideRequestBody = {
      decision_type: "REJECT",
      reason_codes: ["RC101_REJECT_CREDIT_POLICY"],
      adverse_action: true,
    };
    expect(validateDecidePayload(b).formError).toBeUndefined();
  });

  test("notes max length enforced", () => {
    const b: BankDecideRequestBody = {
      decision_type: "APPROVE",
      reason_codes: ["RC001_APPROVE"],
      notes: "x".repeat(2001),
      adverse_action: false,
    };
    const v = validateDecidePayload(b);
    expect(v.fieldErrors.notes).toBeTruthy();
  });

  test("counter requires numeric terms", () => {
    const b: BankDecideRequestBody = {
      decision_type: "COUNTER",
      reason_codes: ["RC201_COUNTER_AMOUNT"],
      counter_terms: { amount: 0, interest_rate: 10, term_months: 60, down_payment_pct: 0 },
      adverse_action: false,
    };
    const v = validateDecidePayload(b);
    expect(v.fieldErrors.counter_amount).toBeTruthy();
  });

  test("counter no_match requires adverse true", () => {
    const b: BankDecideRequestBody = {
      decision_type: "COUNTER",
      reason_codes: ["RC201_COUNTER_AMOUNT"],
      counter_terms: { amount: 100000, interest_rate: 12, term_months: 60, down_payment_pct: 0, no_match: true },
      adverse_action: false,
    };
    expect(validateDecidePayload(b).fieldErrors.adverse_action).toBeTruthy();
  });
});

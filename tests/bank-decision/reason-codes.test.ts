import {
  REASON_CODES_APPROVE,
  REASON_CODES_COUNTER,
  REASON_CODES_REJECT,
  reasonCodesForDecisionType,
  validateReasonCodes,
} from "@/lib/bank-decision/reason-codes";

describe("reason-codes", () => {
  test("arrays are non-empty and unique keys", () => {
    expect(REASON_CODES_APPROVE.length).toBeGreaterThan(0);
    expect(REASON_CODES_REJECT.length).toBeGreaterThan(0);
    expect(REASON_CODES_COUNTER.length).toBeGreaterThan(0);
    expect(new Set(REASON_CODES_APPROVE).size).toBe(REASON_CODES_APPROVE.length);
  });

  test("reasonCodesForDecisionType returns correct bucket", () => {
    expect(reasonCodesForDecisionType("APPROVE")[0]).toContain("RC0");
    expect(reasonCodesForDecisionType("REJECT")[0]).toContain("RC1");
    expect(reasonCodesForDecisionType("COUNTER")[0]).toContain("RC2");
  });

  test("validateReasonCodes rejects empty bundle", () => {
    expect(validateReasonCodes("APPROVE", [])).toBe(false);
  });

  test("validateReasonCodes rejects cross-type codes", () => {
    expect(validateReasonCodes("APPROVE", ["RC101_REJECT_CREDIT_POLICY"])).toBe(false);
    expect(
      validateReasonCodes("APPROVE", [...REASON_CODES_APPROVE.slice(0, 1)]),
    ).toBe(true);
  });

  test("validateReasonCodes null type", () => {
    expect(validateReasonCodes(undefined, ["RC001_APPROVE"])).toBe(false);
  });
});

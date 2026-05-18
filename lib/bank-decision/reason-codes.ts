import type { BankDecisionType } from "@/lib/bank-decision/types";

/** APPROVE reason codes — placeholder prefix per SPEC naming */
export const REASON_CODES_APPROVE = [
  "RC001_APPROVE",
  "RC002_APPROVE",
  "RC003_APPROVE_UNDERWRITING_CLEAN",
  "RC004_APPROVE_DOCUMENTS_OK",
];

/** REJECT reason codes */
export const REASON_CODES_REJECT = [
  "RC101_REJECT_CREDIT_POLICY",
  "RC102_REJECT_FRAUD",
  "RC103_REJECT_INCOME_INCONSISTENT",
  "RC104_REJECT_DEBT_CAPACITY",
];

/** COUNTER/Offer revision reason codes */
export const REASON_CODES_COUNTER = [
  "RC201_COUNTER_AMOUNT",
  "RC202_COUNTER_RATE_TERM",
  "RC203_COUNTER_DOWN_PAYMENT",
  "RC204_COUNTER_PARTIAL_APPROVAL",
];

const BY_TYPE: Record<BankDecisionType, readonly string[]> = {
  APPROVE: REASON_CODES_APPROVE,
  REJECT: REASON_CODES_REJECT,
  COUNTER: REASON_CODES_COUNTER,
};

export function reasonCodesForDecisionType(t: BankDecisionType): readonly string[] {
  return BY_TYPE[t] ?? [];
}

export function validateReasonCodes(t: BankDecisionType | null | undefined, codes: string[]): boolean {
  if (!t) return false;
  const allowed = new Set(reasonCodesForDecisionType(t));
  return codes.length > 0 && codes.every((c) => allowed.has(c));
}

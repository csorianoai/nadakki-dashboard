import type { BankDecisionType } from "@/lib/bank-decision/types";

/** SPEC-003 module tuning */
export const DECISION_TYPES = ["APPROVE", "REJECT", "COUNTER"] as const satisfies readonly BankDecisionType[];

export const NOTES_MAX_CHARS = 2000;
export const COUNTER_DEBOUNCE_MS = 50;

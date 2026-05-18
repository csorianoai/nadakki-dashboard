import { COUNTER_DEBOUNCE_MS, DECISION_TYPES, NOTES_MAX_CHARS } from "@/lib/bank-decision/constants";

describe("bank-decision constants", () => {
  test("DECISION_TYPES trio", () => {
    expect(DECISION_TYPES).toEqual(["APPROVE", "REJECT", "COUNTER"]);
  });

  test("NOTES and debounce sizing", () => {
    expect(NOTES_MAX_CHARS).toBe(2000);
    expect(COUNTER_DEBOUNCE_MS).toBe(50);
  });
});

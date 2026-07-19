import {
  normalizeAvailableActions,
  normalizeStateTransitions,
} from "@/lib/legal/cases/normalize-available-actions";

describe("normalize-available-actions", () => {
  it("maps string[] from live backend to AvailableAction objects", () => {
    const out = normalizeAvailableActions(["upload_document", "generate_strategies"]);
    expect(out).toHaveLength(2);
    expect(out[0]!.action_name).toBe("upload_document");
    expect(out[1]!.consumes_llm_tokens).toBe(true);
  });

  it("normalizes allowed_transitions", () => {
    expect(normalizeStateTransitions(["STRATEGY", "CLOSED"])).toEqual(["STRATEGY", "CLOSED"]);
  });
});

import {
  complianceMatchesFromResults,
  complianceStatusFromResults,
} from "@/lib/credit-hub/api/securityClient";

describe("securityClient compliance helpers", () => {
  test("complianceStatusFromResults detects match", () => {
    expect(
      complianceStatusFromResults([{ result: "MATCH", match_name: "John", match_score: 0.9 }]),
    ).toBe("MATCH_FOUND");
  });

  test("complianceStatusFromResults clear when no match", () => {
    expect(complianceStatusFromResults([{ result: "CLEAR" }])).toBe("CLEAR");
  });

  test("complianceMatchesFromResults maps rows", () => {
    const matches = complianceMatchesFromResults([
      { result: "MATCH", match_name: "A", match_score: 1 },
      { result: "CLEAR" },
    ]);
    expect(matches).toHaveLength(1);
    expect(matches[0]?.name).toBe("A");
  });
});

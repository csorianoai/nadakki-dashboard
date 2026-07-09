import { ltvAlertCopy, ltvAlertLevel } from "@/lib/credit-hub/dealer/ltv-alert";

describe("ltv-alert", () => {
  it("warning at 80%", () => {
    expect(ltvAlertLevel(80)).toBe("warning");
    expect(ltvAlertCopy("warning", 82)).toMatch(/82%/);
  });

  it("danger at 90%", () => {
    expect(ltvAlertLevel(90)).toBe("danger");
    expect(ltvAlertCopy("danger", 92)).toMatch(/92%/);
  });

  it("none below 80%", () => {
    expect(ltvAlertLevel(79)).toBe("none");
    expect(ltvAlertCopy("none", 79)).toBeNull();
  });
});

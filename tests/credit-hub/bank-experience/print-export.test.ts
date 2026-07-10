import { applicationSummaryPdfPath } from "@/lib/credit-hub/api/bankExperienceClient";

describe("print-export F5", () => {
  test("applicationSummaryPdfPath encodes application id", () => {
    expect(applicationSummaryPdfPath("app/123")).toContain("app%2F123");
    expect(applicationSummaryPdfPath("app/123")).toContain("/pdf/application-summary");
  });
});

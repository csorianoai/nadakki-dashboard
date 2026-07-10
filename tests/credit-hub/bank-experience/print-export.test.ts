import {
  auditTrailPdfPath,
  bankQueueExcelPath,
  decisionLetterPdfPath,
  expedientePdfPath,
} from "@/lib/credit-hub/api/bankExperienceClient";

describe("print-export alignment", () => {
  test("expedientePdfPath encodes application id", () => {
    expect(expedientePdfPath("app/123")).toContain("app%2F123");
    expect(expedientePdfPath("app/123")).toContain("/export/expediente.pdf");
  });

  test("decisionLetterPdfPath includes offer_id query", () => {
    const path = decisionLetterPdfPath("app-1", "offer-9");
    expect(path).toContain("/export/decision-letter.pdf");
    expect(path).toContain("offer_id=offer-9");
  });

  test("auditTrailPdfPath uses export route", () => {
    expect(auditTrailPdfPath("abc")).toContain("/export/audit-trail.pdf");
  });

  test("bankQueueExcelPath matches backend", () => {
    expect(bankQueueExcelPath()).toBe("/api/v2/credit/bank/export/queue.xlsx");
  });
});

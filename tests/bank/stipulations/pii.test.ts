import { maskAuditDetail } from "@/lib/bank/stipulations/pii";

describe("maskAuditDetail", () => {
  test("TENANT_ADMIN sees raw detail", () => {
    expect(maskAuditDetail("cedula 402-1234567-8", "TENANT_ADMIN")).toBe("cedula 402-1234567-8");
  });

  test("BANK_ANALYST masks DO pattern", () => {
    expect(maskAuditDetail("verificado 402-1234567-8", "BANK_ANALYST")).toContain("***");
    expect(maskAuditDetail("verificado 402-1234567-8", "BANK_ANALYST")).not.toContain("1234567");
  });

  test("empty becomes em dash", () => {
    expect(maskAuditDetail(undefined, "BANK_ANALYST")).toBe("—");
  });
});

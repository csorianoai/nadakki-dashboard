import { resolveObservabilityXRole } from "@/lib/admin/observability-role";

const envKey = "NEXT_PUBLIC_OBSERVABILITY_X_ROLE";

describe("resolveObservabilityXRole", () => {
  const prev = process.env[envKey];

  afterEach(() => {
    if (prev === undefined) delete process.env[envKey];
    else process.env[envKey] = prev;
  });

  test("env override wins", () => {
    process.env[envKey] = "SYSTEM_ADMIN";
    expect(resolveObservabilityXRole("viewer")).toBe("SYSTEM_ADMIN");
  });

  test("maps owner/admin/editor to TENANT_ADMIN", () => {
    delete process.env[envKey];
    expect(resolveObservabilityXRole("owner")).toBe("TENANT_ADMIN");
    expect(resolveObservabilityXRole("admin")).toBe("TENANT_ADMIN");
    expect(resolveObservabilityXRole("editor")).toBe("TENANT_ADMIN");
  });

  test("maps bank analyst strings to BANK_ANALYST", () => {
    delete process.env[envKey];
    expect(resolveObservabilityXRole("bank_analyst")).toBe("BANK_ANALYST");
    expect(resolveObservabilityXRole("risk analyst")).toBe("BANK_ANALYST");
  });

  test("viewer defaults to BANK_ANALYST (read-only)", () => {
    delete process.env[envKey];
    expect(resolveObservabilityXRole("viewer")).toBe("BANK_ANALYST");
  });

  test("maps platform-ish keys to SYSTEM_ADMIN", () => {
    delete process.env[envKey];
    expect(resolveObservabilityXRole("superadmin")).toBe("SYSTEM_ADMIN");
  });
});

import { canMutateStipulations, resolveStipulationsApiRoleFromStorage } from "@/lib/bank/stipulations/resolve-role";

describe("resolve-role stipulations", () => {
  beforeEach(() => localStorage.clear());

  test("admin storage maps to TENANT_ADMIN", () => {
    localStorage.setItem("nadakki_role", "admin");
    expect(resolveStipulationsApiRoleFromStorage()).toBe("TENANT_ADMIN");
  });

  test("viewer maps to BANK_ANALYST", () => {
    localStorage.setItem("nadakki_role", "viewer");
    expect(resolveStipulationsApiRoleFromStorage()).toBe("BANK_ANALYST");
  });

  test("canMutate only for TENANT_ADMIN", () => {
    expect(canMutateStipulations("TENANT_ADMIN")).toBe(true);
    expect(canMutateStipulations("BANK_ANALYST")).toBe(false);
  });
});

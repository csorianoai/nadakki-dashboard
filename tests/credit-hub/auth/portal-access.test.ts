import { roleKeyAllowsPortal, roleKeyAllowsAdminNetwork, resolveCHActorRole, actorCan } from "@/lib/credit-hub/auth/portal-access";

describe("portal-access", () => {
  test("dealer portal allows credit_admin", () => {
    expect(roleKeyAllowsPortal("credit_admin", "dealer")).toBe(true);
  });

  test("dealer portal blocks bank_analyst", () => {
    expect(roleKeyAllowsPortal("bank_analyst", "dealer")).toBe(false);
  });

  test("bank portal allows bank_analyst", () => {
    expect(roleKeyAllowsPortal("bank_analyst", "bank")).toBe(true);
  });

  test("admin network allows platform_superadmin", () => {
    expect(roleKeyAllowsAdminNetwork("platform_superadmin")).toBe(true);
  });

  test("admin network allows tenant_admin", () => {
    expect(roleKeyAllowsAdminNetwork("tenant_admin")).toBe(true);
  });

  test("admin network blocks generic admin and dealer", () => {
    expect(roleKeyAllowsAdminNetwork("admin")).toBe(false);
    expect(roleKeyAllowsAdminNetwork("dealer")).toBe(false);
    expect(roleKeyAllowsAdminNetwork("bank_analyst")).toBe(false);
  });

  test("bank_analyst cannot accept_offer", () => {
    const actor = resolveCHActorRole("bank_analyst");
    expect(actorCan(actor, "create_decision")).toBe(true);
    expect(actorCan(actor, "accept_offer")).toBe(false);
  });

  test("credit_admin maps to bank admin actor with decision rights", () => {
    const actor = resolveCHActorRole("credit_admin");
    expect(actor).toBe("bank_admin");
    expect(actorCan(actor, "create_decision")).toBe(true);
    expect(actorCan(actor, "accept_offer")).toBe(false);
  });
});

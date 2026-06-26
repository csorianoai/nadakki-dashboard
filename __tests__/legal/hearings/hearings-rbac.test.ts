import { canManageHearings } from "@/lib/legal/hearings/hearings-rbac";

describe("canManageHearings (cosmetic gating; backend 403 is the authority)", () => {
  it("treats unknown/empty roles as authorized (do not hide on uncertainty)", () => {
    expect(canManageHearings([])).toBe(true);
    expect(canManageHearings(null)).toBe(true);
    expect(canManageHearings(undefined)).toBe(true);
  });

  it("authorizes clearly-authorizing role_keys", () => {
    expect(canManageHearings([{ role_key: "legal_admin" }])).toBe(true);
    expect(canManageHearings([{ role_key: "tenant_admin" }])).toBe(true);
    expect(canManageHearings([{ role_key: "platform_superadmin" }])).toBe(true);
  });

  it("hides for roles with no clearly-authorizing key", () => {
    expect(canManageHearings([{ role_key: "marketer" }])).toBe(false);
    expect(canManageHearings([{ role_key: "bank_analyst" }])).toBe(false);
  });
});

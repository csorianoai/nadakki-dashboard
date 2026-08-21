import {
  calculateCommissionAmount,
  commissionsToCsv,
  filterCommissionsByDateRange,
  filterCommissionsByDealer,
  financingLeadToCommissionRow,
} from "@/lib/autos-portal/commission-calc";
import { resolveAutosAdminAccess } from "@/lib/autos-portal/admin-rbac";
import { normalizeFlags } from "@/lib/autos-portal/admin-api-normalize";

describe("commission-calc", () => {
  it("calculates 3% commission", () => {
    expect(calculateCommissionAmount(20_000)).toBe(600);
    expect(calculateCommissionAmount(0)).toBe(0);
  });

  it("filters by date range", () => {
    const rows = [
      {
        lead_id: "a",
        vehicle_name: "X",
        dealer_id: "d1",
        requested_amount: 1000,
        commission_amount: 30,
        created_at: "2026-01-15T12:00:00.000Z",
      },
      {
        lead_id: "b",
        vehicle_name: "Y",
        dealer_id: "d1",
        requested_amount: 2000,
        commission_amount: 60,
        created_at: "2026-02-15T12:00:00.000Z",
      },
    ];
    const start = new Date("2026-02-01T00:00:00.000Z").getTime();
    const end = new Date("2026-02-28T23:59:59.999Z").getTime();
    expect(filterCommissionsByDateRange(rows, start, end)).toHaveLength(1);
  });

  it("exports CSV header and row", () => {
    const row = financingLeadToCommissionRow({
      lead_id: "lead-1",
      tenant_id: "t1",
      user_id: "u1",
      vehicle_id: "v1",
      vehicle_name: "2022 Toyota",
      vehicle_price: 1_000_000,
      requested_amount: 800_000,
      down_payment: 200_000,
      term_months: 60,
      status: "FINANCED",
      created_at: "2026-03-01T00:00:00.000Z",
      updated_at: "2026-03-01T00:00:00.000Z",
    });
    const csv = commissionsToCsv([row]);
    expect(csv.split("\n")[0]).toContain("Lead ID");
    expect(csv).toContain("lead-1");
  });
});

describe("admin-rbac", () => {
  it("grants platform admin full moderation", () => {
    const access = resolveAutosAdminAccess(["platform_admin"]);
    expect(access.canModerateVehicles).toBe(true);
    expect(access.canVerifyDealers).toBe(true);
    expect(access.canManageFlags).toBe(true);
  });

  it("limits tenant admin to flags and commissions", () => {
    const access = resolveAutosAdminAccess(["tenant_admin"]);
    expect(access.canModerateVehicles).toBe(false);
    expect(access.canManageFlags).toBe(true);
    expect(access.canViewCommissions).toBe(true);
  });

  it("denies regular user", () => {
    const access = resolveAutosAdminAccess(["dealer_user"]);
    expect(access.isPlatformAdmin).toBe(false);
    expect(access.isTenantAdmin).toBe(false);
  });
});

describe("admin-api normalize flags", () => {
  it("reads nested flags object", () => {
    const flags = normalizeFlags({ flags: { financing: false, compare: true } });
    expect(flags.financing).toBe(false);
    expect(flags.compare).toBe(true);
    expect(flags.leads).toBe(true);
  });
});

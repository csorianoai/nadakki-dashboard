import type { FinancingLead, FinancingLeadCreatePayload } from "@/types/autos";
import { TENANTS } from "@/lib/tenants";

const TENANT_A = TENANTS.nadakki.tenantId;
const TENANT_B = TENANTS.credicefi.tenantId;

function sampleLead(overrides: Partial<FinancingLead> = {}): FinancingLead {
  return {
    lead_id: "lead_abc123def456",
    tenant_id: TENANT_A,
    user_id: "11111111-1111-1111-1111-111111111111",
    vehicle_id: "veh_123",
    vehicle_name: "2022 Toyota Corolla",
    vehicle_price: 2_500_000,
    vehicle_image: "https://example.com/v.jpg",
    requested_amount: 2_000_000,
    down_payment: 500_000,
    term_months: 60,
    status: "PENDING",
    credit_hub_application_id: "app_xyz",
    created_at: "2026-07-20T12:00:00.000Z",
    updated_at: "2026-07-20T12:00:00.000Z",
    ...overrides,
  };
}

describe("financing leads types", () => {
  it("sample lead starts in PENDING status", () => {
    const lead = sampleLead();
    expect(lead.status).toBe("PENDING");
  });

  it("create payload shape matches backend contract", () => {
    const payload: FinancingLeadCreatePayload = {
      vehicle_id: "veh_123",
      vehicle_data: {
        name: "Toyota",
        price: 2500000,
        image: "https://example.com/v.jpg",
      },
      financing_data: {
        requested_amount: 2000000,
        down_payment: 500000,
        term_months: 60,
      },
      credit_hub_application_id: "app_xyz",
    };

    expect(payload.financing_data.term_months).toBe(60);
    expect(payload.vehicle_data.price).toBeGreaterThan(0);
  });

  it("tenant ids are distinct for isolation checks", () => {
    expect(TENANT_A).not.toBe(TENANT_B);
  });

  it("status transitions are represented as union values", () => {
    const statuses: FinancingLead["status"][] = [
      "PENDING",
      "FINANCED",
      "REJECTED",
      "EXPIRED",
    ];
    statuses.forEach((status) => {
      expect(sampleLead({ status }).status).toBe(status);
    });
  });
});

describe("financing bridge URL contract", () => {
  it("builds credit hub preset query params", () => {
    const returnUrl = "/autos/vehiculo/veh_123?financing_return=1";
    const preset = new URLSearchParams({
      vehicle_id: "veh_123",
      term_months: "60",
      down_payment: "500000",
      requested_amount: "2000000",
      return: returnUrl,
    });

    expect(preset.get("vehicle_id")).toBe("veh_123");
    expect(preset.get("term_months")).toBe("60");
    expect(preset.get("return")).toContain("financing_return=1");
  });
});

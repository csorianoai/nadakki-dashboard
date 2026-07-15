/**
 * Type-level validation tests for Autos Portal TypeScript types.
 *
 * These tests verify that TypeScript interfaces are structurally correct
 * by constructing sample objects and asserting key properties.
 * No DOM rendering required — pure type + runtime checks.
 */

import type {
  Vehicle,
  VehicleCreatePayload,
  VehicleSearchFilters,
  VehicleSearchResult,
  Lead,
  LeadCreatePayload,
  LeadStatus,
  FinanceCalculatePayload,
  FinanceCalculateResult,
  FinanceInverseResult,
  AmortizationPeriod,
  AmortizationResult,
  EntitlementDecision,
  PlanInfo,
  VinDecodeResult,
} from "@/types/autos";

describe("Autos Portal Types", () => {
  describe("Vehicle", () => {
    it("accepts a minimal vehicle", () => {
      const v: Vehicle = {
        id: "v-001",
        tenant_id: "t-001",
        dealer_id: "d-001",
        make: "Toyota",
        model: "Corolla",
        year: 2020,
        condition: "used",
      };
      expect(v.make).toBe("Toyota");
      expect(v.condition).toBe("used");
      expect(v.vin).toBeUndefined();
    });

    it("accepts a full vehicle with all optional fields", () => {
      const v: Vehicle = {
        id: "v-002",
        tenant_id: "t-001",
        dealer_id: "d-001",
        make: "Honda",
        model: "Civic",
        year: 2019,
        vin: "2HGFC2F59MH123456",
        trim: "Sport",
        body_type: "sedan",
        fuel_type: "gasolina",
        transmission: "automatica",
        drivetrain: "FWD",
        exterior_color: "rojo",
        interior_color: "negro",
        mileage_km: 45000,
        condition: "used",
        price_rd: 750000,
        price_usd: 12500,
        description: "Excelente condición",
        province: "Santo Domingo",
        municipality: "Santo Domingo Este",
        status: "active",
        cover_photo_url: "https://cdn.example.com/photo.jpg",
        photo_count: 5,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-07-01T00:00:00Z",
      };
      expect(v.vin).toBe("2HGFC2F59MH123456");
      expect(v.price_rd).toBe(750000);
    });
  });

  describe("VehicleCreatePayload", () => {
    it("requires make, model, year", () => {
      const payload: VehicleCreatePayload = {
        make: "Toyota",
        model: "RAV4",
        year: 2023,
      };
      expect(payload.make).toBe("Toyota");
      expect(payload.condition).toBeUndefined();
    });
  });

  describe("VehicleSearchFilters", () => {
    it("all fields are optional", () => {
      const filters: VehicleSearchFilters = {};
      expect(filters.query).toBeUndefined();
      expect(filters.page).toBeUndefined();
    });

    it("accepts full filter set", () => {
      const filters: VehicleSearchFilters = {
        query: "Toyota SUV",
        make: "Toyota",
        year_min: 2018,
        year_max: 2023,
        price_min: 500000,
        price_max: 1200000,
        condition: "used",
        province: "Santiago",
        page: 2,
        page_size: 50,
      };
      expect(filters.query).toBe("Toyota SUV");
      expect(filters.page).toBe(2);
    });
  });

  describe("VehicleSearchResult", () => {
    it("has correct shape", () => {
      const result: VehicleSearchResult = {
        vehicles: [],
        total: 0,
        page: 1,
        page_size: 20,
        has_next: false,
      };
      expect(result.total).toBe(0);
      expect(result.has_next).toBe(false);
    });
  });

  describe("Lead", () => {
    it("accepts all valid statuses", () => {
      const statuses: LeadStatus[] = [
        "new",
        "contacted",
        "qualified",
        "negotiating",
        "won",
        "lost",
        "archived",
      ];
      statuses.forEach((status) => {
        const lead: Lead = {
          id: "l-001",
          tenant_id: "t-001",
          dealer_id: "d-001",
          buyer_name: "Juan",
          source: "marketplace",
          status,
          priority: "normal",
          finance_interested: false,
        };
        expect(lead.status).toBe(status);
      });
    });

    it("accepts finance-interested lead with budget", () => {
      const lead: Lead = {
        id: "l-002",
        tenant_id: "t-001",
        dealer_id: "d-001",
        buyer_name: "María",
        buyer_email: "maria@example.com",
        source: "referral",
        status: "qualified",
        priority: "high",
        finance_interested: true,
        monthly_budget_rd: 15000,
      };
      expect(lead.finance_interested).toBe(true);
      expect(lead.monthly_budget_rd).toBe(15000);
    });
  });

  describe("LeadCreatePayload", () => {
    it("requires buyer_name", () => {
      const payload: LeadCreatePayload = {
        buyer_name: "Pedro",
        buyer_phone: "809-555-1234",
      };
      expect(payload.buyer_name).toBe("Pedro");
      expect(payload.source).toBeUndefined();
    });
  });

  describe("FinanceCalculatePayload", () => {
    it("has all required fields", () => {
      const payload: FinanceCalculatePayload = {
        vehicle_price: 800000,
        down_payment: 160000,
        annual_rate_pct: 12,
        term_months: 48,
      };
      expect(payload.vehicle_price).toBe(800000);
      expect(payload.term_months).toBe(48);
    });
  });

  describe("FinanceCalculateResult", () => {
    it("has correct shape", () => {
      const result: FinanceCalculateResult = {
        monthly_payment: 16856.23,
        total_interest: 169099.04,
        total_cost: 809099.04,
        principal: 640000,
        annual_rate_pct: 12,
        term_months: 48,
        down_payment: 160000,
      };
      expect(result.monthly_payment).toBeCloseTo(16856.23);
      expect(result.principal).toBe(640000);
    });
  });

  describe("FinanceInverseResult", () => {
    it("has correct shape", () => {
      const result: FinanceInverseResult = {
        max_vehicle_price: 769123.45,
        monthly_budget: 15000,
        down_payment: 200000,
        annual_rate_pct: 12,
        term_months: 48,
      };
      expect(result.max_vehicle_price).toBeCloseTo(769123.45);
    });
  });

  describe("AmortizationResult", () => {
    it("has periods array", () => {
      const period: AmortizationPeriod = {
        period: 1,
        payment: 16856.23,
        principal_portion: 10456.23,
        interest_portion: 6400,
        remaining_balance: 629543.77,
      };
      const result: AmortizationResult = {
        total_payments: 809099.04,
        total_interest: 169099.04,
        total_principal: 640000,
        periods: [period],
      };
      expect(result.periods).toHaveLength(1);
      expect(result.periods[0].period).toBe(1);
    });
  });

  describe("VinDecodeResult", () => {
    it("has correct shape", () => {
      const result: VinDecodeResult = {
        vin: "1HGCM82633A004352",
        make: "Honda",
        model: "Accord",
        year: 2003,
        cache_hit: false,
      };
      expect(result.vin).toBe("1HGCM82633A004352");
      expect(result.cache_hit).toBe(false);
    });
  });

  describe("EntitlementDecision", () => {
    it("represents allowed decision", () => {
      const d: EntitlementDecision = {
        allowed: true,
        capability: "vehicle_listings",
        limit: 100,
      };
      expect(d.allowed).toBe(true);
    });

    it("represents denied decision", () => {
      const d: EntitlementDecision = {
        allowed: false,
        capability: "ai_concierge",
        reason: "plan_limit_exceeded",
      };
      expect(d.allowed).toBe(false);
      expect(d.reason).toBe("plan_limit_exceeded");
    });
  });

  describe("PlanInfo", () => {
    it("has ITBIS breakdown", () => {
      const plan: PlanInfo = {
        slug: "conecta",
        subtotal_rd: 3500,
        itbis: 630,
        total_rd: 4130,
      };
      expect(plan.total_rd).toBe(plan.subtotal_rd + plan.itbis);
    });
  });
});

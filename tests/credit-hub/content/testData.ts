import type { CreditApplication } from "@/lib/credit-hub/types/creditCore";

export function makeApplication(overrides: Partial<CreditApplication> = {}): CreditApplication {
  return {
    id: "app-1",
    application_id: "app-1",
    tenant_id: "tenant-1",
    applicant_name: "Ana Pérez",
    applicant_email: "ana@example.com",
    applicant_phone: "8095550000",
    monthly_income: null,
    vehicle_vin: "1HGCM82633A004352",
    vehicle_year: 2023,
    vehicle_make: "Toyota",
    vehicle_model: "Hilux",
    vehicle_price: null,
    requested_amount: "500000",
    down_payment: "100000",
    status: "submitted",
    score: null,
    risk_score: null,
    decision: null,
    recommendation: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    raw: null,
    ...overrides,
  };
}

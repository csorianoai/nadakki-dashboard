import type { CHApplication } from "@/lib/credit-hub/types/_generated";

export function makeApplication(overrides: Partial<CHApplication> = {}): CHApplication {
  return {
    application_id: "app-1",
    tenant_id: "tenant-1",
    applicant_name: "Ana Pérez",
    applicant_email: "ana@example.com",
    applicant_phone: "8095550000",
    dealer_id: null,
    vehicle_vin: "1HGCM82633A004352",
    vehicle_year: 2023,
    vehicle_make: "Toyota",
    vehicle_model: "Hilux",
    requested_amount: "500000",
    down_payment: "100000",
    status: "submitted",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

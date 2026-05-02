/**
 * Local-only TestBank Mexico fixture for Forge reusability validation.
 * Activated when `NEXT_PUBLIC_FORGE_TEST_TENANT=mx` (see `lib/credit-hub/forge-test-tenant-override.ts`).
 * Never deployed to production tenant branding APIs.
 */
import type { TenantBankingConfig } from "@/lib/credit-hub/types/tenantConfig";

export const FORGE_TEST_MX_TENANT_ID = "test-mx-tenant-uuid";

export const TESTBANK_MEXICO_FIXTURE: TenantBankingConfig = {
  tenant_id: FORGE_TEST_MX_TENANT_ID,
  institution_name: "TestBank Mexico",
  institution_type: "FINANCIAL_INSTITUTION",
  country_code: "MX",
  currency_code: "MXN",
  currency_symbol: "MX$",
  locale: "es-MX",
  regulatory_profile: "CNBV_MX",
  branding: {
    logo_url: "/forge-inventory/testbank-mexico-logo.svg",
    primary_color: "#7B1F1F",
    secondary_color: "#3D0A0A",
    accent_color: "#7B1F1F",
  },
  scoring_thresholds: { excellent: 800, good: 700, fair: 580 },
  vehicle_types: ["Nuevo", "Usado", "Demo"],
  product_types: ["Vehículo nuevo", "Vehículo usado", "Motor", "Camión", "Maquinaria", "Otro"],
  document_types: { primary_id: "INE", alternative_ids: ["PASAPORTE", "OTRO"] },
  min_age: 18,
  max_age: 75,
  min_employment_years: 0.5,
  pii_masking_enabled: true,
  required_documents: [
    { key: "ine_mx", label: "Identificación oficial (INE o pasaporte)", required: true },
    { key: "comprobante_ingresos", label: "Comprobante de ingresos reciente", required: true },
  ],
  features_enabled: {
    remote_consent: true,
    preapproval_simulator: true,
    garante_required: false,
  },
  consent_methods_enabled: ["WHATSAPP", "EMAIL", "SMS_OTP", "SELFIE"],
  default_rate: 16,
  min_rate: 10,
  max_rate: 25,
  allowed_terms: [12, 24, 36, 48, 60, 72, 84],
  default_term: 60,
  product_limits: {
    min_loan: 50_000,
    max_loan: 3_000_000,
    min_down_payment_ratio: 0.1,
    max_ltv: 0.95,
  },
  dti_warning_ratio: 0.85,
  dti_max: 0.4,
  ltv_max: 0.95,
  min_roi_threshold: 30,
  risk_multipliers: { BAJO: 1.0, MEDIO: 0.75, ALTO: 0.5 },
  payment_capacity_ratio: 0.4,
};

"use client";

import { useMemo } from "react";
import { useTenant } from "./useTenant";
import type { TenantBankingConfig } from "../types/tenantConfig";
import { DEFAULT_DO_REQUIRED_DOCUMENTS } from "@/lib/credit-hub/defaults/do-required-documents";

/** Valores por defecto República Dominicana — simulador y políticas de exhibición en tenant. */
const DEFAULT_DO_SIMULATOR_CONFIG: Pick<
  TenantBankingConfig,
  | "default_rate"
  | "min_rate"
  | "max_rate"
  | "allowed_terms"
  | "default_term"
  | "product_limits"
  | "dti_warning_ratio"
  | "dti_max"
  | "ltv_max"
  | "min_roi_threshold"
  | "risk_multipliers"
  | "payment_capacity_ratio"
> = {
  default_rate: 16,
  min_rate: 10,
  max_rate: 25,
  allowed_terms: [12, 24, 36, 48, 60, 72, 84],
  default_term: 60,
  product_limits: {
    min_loan: 100_000,
    max_loan: 5_000_000,
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

export function getDefaultTenantBankingConfig(tenantId: string): TenantBankingConfig {
  return {
    tenant_id: tenantId,
    institution_name: "Institución financiera",
    institution_type: "FINANCIAL_INSTITUTION",
    country_code: "DO",
    currency_code: "DOP",
    currency_symbol: "RD$",
    locale: "es-DO",
    regulatory_profile: "DO_LEY_172_13",
    branding: {
      logo_url: null,
      primary_color: "#ff6b35",
      secondary_color: "#0f172a",
      accent_color: "#2563eb",
    },
    scoring_thresholds: { excellent: 800, good: 700, fair: 580 },
    vehicle_types: ["Nuevo", "Usado", "Demo"],
    product_types: ["Vehículo nuevo", "Vehículo usado", "Motor", "Camión", "Maquinaria", "Otro"],
    document_types: { primary_id: "CEDULA", alternative_ids: ["PASAPORTE", "OTRO"] },
    min_age: 18,
    max_age: 75,
    min_employment_years: 0.5,
    pii_masking_enabled: true,
    required_documents: [...DEFAULT_DO_REQUIRED_DOCUMENTS],
    features_enabled: {
      remote_consent: true,
      preapproval_simulator: true,
      garante_required: false,
    },
    consent_methods_enabled: ["WHATSAPP_LINK", "OTP_EMAIL", "OTP_SMS", "SELFIE"],
    ...DEFAULT_DO_SIMULATOR_CONFIG,
  };
}

export function useTenantConfig(): { tenantConfig: TenantBankingConfig; loading: boolean } {
  const { tenantId, loading } = useTenant();
  const config = useMemo(() => getDefaultTenantBankingConfig(tenantId || "tenant-no-disponible"), [tenantId]);
  return { tenantConfig: config, loading };
}

export { DEFAULT_DO_REQUIRED_DOCUMENTS } from "@/lib/credit-hub/defaults/do-required-documents";

"use client";

import { useMemo } from "react";
import { useTenant } from "./useTenant";
import type { TenantBankingConfig } from "../types/tenantConfig";
import { DEFAULT_DO_REQUIRED_DOCUMENTS } from "@/lib/credit-hub/defaults/do-required-documents";

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
    dti_max: 0.45,
    ltv_max: 0.9,
    min_age: 18,
    max_age: 75,
    min_employment_years: 0.5,
    pii_masking_enabled: true,
    default_rate: 18,
    allowed_terms: [12, 24, 36, 48, 60, 72, 84],
    required_documents: [...DEFAULT_DO_REQUIRED_DOCUMENTS],
    features_enabled: {
      remote_consent: true,
      preapproval_simulator: true,
      garante_required: false,
    },
    consent_methods_enabled: ["WHATSAPP_LINK", "OTP_EMAIL", "OTP_SMS", "SELFIE"],
  };
}

export function useTenantConfig(): { tenantConfig: TenantBankingConfig; loading: boolean } {
  const { tenantId, loading } = useTenant();
  const config = useMemo(() => getDefaultTenantBankingConfig(tenantId || "tenant-no-disponible"), [tenantId]);
  return { tenantConfig: config, loading };
}

export { DEFAULT_DO_REQUIRED_DOCUMENTS } from "@/lib/credit-hub/defaults/do-required-documents";

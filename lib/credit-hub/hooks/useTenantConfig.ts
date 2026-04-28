"use client";

import { useMemo } from "react";
import { useTenant } from "./useTenant";
import type { TenantBankingConfig } from "../types/tenantConfig";

function buildDefaultConfig(tenantId: string): TenantBankingConfig {
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
    required_documents: [
      { id: "id", label: "Cédula de identidad (frente y reverso)", required: true, tooltip: "Documento principal del solicitante." },
      { id: "employment_letter", label: "Carta de trabajo o constancia laboral", required: true, tooltip: "Evidencia del empleo actual." },
      { id: "bank_statements", label: "Últimos 3 estados de cuenta bancarios", required: true, tooltip: "Soporte de movimiento y capacidad." },
      { id: "additional_income", label: "Evidencia de ingresos adicionales (si aplica)", required: false, tooltip: "Soporte de rentas, remesas u otros ingresos." },
      { id: "address_proof", label: "Comprobante de domicilio", required: true, tooltip: "Factura de servicio o documento equivalente." },
      { id: "references", label: "Referencias personales (mínimo 2)", required: false, tooltip: "Contactos de referencia." },
      { id: "vehicle_documents", label: "Documentos del vehículo (matrícula si usado)", required: false, tooltip: "Aplica para vehículos usados." },
      { id: "other", label: "Otros documentos relevantes", required: false, tooltip: "Cualquier soporte adicional." },
    ],
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
  const config = useMemo(() => buildDefaultConfig(tenantId || "tenant-no-disponible"), [tenantId]);
  return { tenantConfig: config, loading };
}

export interface TenantRequiredDocument {
  /** Stable checklist key (preferred). */
  key?: string;
  /** Legacy checklist id (maps to `key` when `key` omitted). */
  id?: string;
  label: string;
  required: boolean;
  tooltip?: string;
}

export interface TenantProductLimits {
  min_loan: number;
  max_loan: number;
  min_down_payment_ratio: number;
  max_ltv: number;
}

export interface TenantRiskMultipliers {
  BAJO: number;
  MEDIO: number;
  ALTO: number;
}

export interface TenantBankingConfig {
  tenant_id: string;
  institution_name: string;
  institution_type: string;
  country_code: "DO" | "MX" | "CO" | "PE" | (string & {});
  currency_code: string;
  currency_symbol: string;
  locale: string;
  regulatory_profile: string;
  branding: {
    logo_url: string | null;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
  };
  scoring_thresholds: { excellent: number; good: number; fair: number };
  vehicle_types: string[];
  product_types: string[];
  /** primary_id and alternative_ids are machine codes, e.g. CEDULA, PASAPORTE, OTRO */
  document_types: { primary_id: string; alternative_ids: string[] };
  dti_max: number;
  ltv_max: number;
  min_age: number;
  max_age: number;
  min_employment_years: number;
  pii_masking_enabled: boolean;
  default_rate: number;
  /** % anual mínimo institucional (simulador y controles). */
  min_rate?: number;
  /** % anual máximo institucional. */
  max_rate?: number;
  allowed_terms: number[];
  /** Plazo por defecto del simulador (meses). */
  default_term?: number;
  product_limits?: TenantProductLimits;
  /** Fracción 0–1: umbral “ajustar” respecto a DTI máximo (p. ej. 0.85). */
  dti_warning_ratio?: number;
  /** % mínimo de ROI bruto institucional para alertas en el simulador. */
  min_roi_threshold?: number;
  risk_multipliers?: TenantRiskMultipliers;
  /** Ratio de capacidad de pago (ingreso × ratio − deudas), alineado con `calculatePaymentCapacity`. */
  payment_capacity_ratio?: number;
  required_documents: TenantRequiredDocument[];
  features_enabled: {
    remote_consent: boolean;
    preapproval_simulator: boolean;
    garante_required: boolean;
    bank_reports?: boolean;
    bulk_decide?: boolean;
    contra_offer?: boolean;
    export_pdf?: boolean;
    export_excel?: boolean;
    committee_view?: boolean;
  };
  /** When set, warn if guarantor monthly income is below estimated payment × ratio. */
  garante_minimum_income_ratio?: number;
  consent_methods_enabled: Array<"OTP_SMS" | "OTP_EMAIL" | "WHATSAPP_LINK" | "SELFIE" | "SIGNED_PDF">;
}

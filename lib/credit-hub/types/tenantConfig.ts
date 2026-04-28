export interface TenantRequiredDocument {
  /** Stable checklist key (preferred). */
  key?: string;
  /** Legacy checklist id (maps to `key` when `key` omitted). */
  id?: string;
  label: string;
  required: boolean;
  tooltip?: string;
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
  allowed_terms: number[];
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

/**
 * Legacy default tenant UUID for Credit Core.
 *
 * @deprecated Fase 2 multi-institution: do NOT use as a fallback.
 * Callers must resolve tenant from auth context or env var.
 * Kept only for the UUID→slug mapping below.
 */
export const DEFAULT_CREDIT_TENANT_ID = "0a91ee98-2dbe-46d0-a43c-3fc2dbd42242";

/**
 * Mapping from tenant UUID (used in JWT/session) to tenant slug
 * (used by backend `tenant_branding` table as primary key).
 *
 * Verified (P10-05 BUG-001 fix, 2026-05-10):
 * - Backend seed in `nadakki-ai-suite/backend/db/setup.py`
 * - PowerShell smoke test confirmed:
 *   - GET /api/v2/tenants/credicefi/branding -> 200
 *   - GET /api/v2/tenants/banco-piloto-rd/branding -> 200
 *
 * TODO P10-09: replace with backend-provided mapping via
 * `/api/v2/tenants/{uuid}/resolve-slug` once that endpoint exists.
 */
export const TENANT_UUID_TO_SLUG: Record<string, string> = {
  "0a91ee98-2dbe-46d0-a43c-3fc2dbd42242": "credicefi",
  "550e8400-e29b-41d4-a716-446655440099": "banco-piloto-rd",
  "366b3c6c-a899-4320-805e-5c1d7c896f74": "sf-rentals-nadaki-excursions",
};

/**
 * Resolves a tenant identifier (UUID or slug) to its canonical slug.
 * Returns the input unchanged if it's already a slug or unknown.
 */
export function resolveTenantSlug(tenantIdOrSlug: string): string {
  return TENANT_UUID_TO_SLUG[tenantIdOrSlug] ?? tenantIdOrSlug;
}

export type CreditApplicationStatus =
  | "draft"
  | "submitted"
  | "processing"
  | "processed"
  | "approved"
  | "rejected"
  | "declined"
  | "conditioned"
  | "manual_review"
  | "unknown"
  | (string & {});

export type CreditDecision = "approved" | "rejected" | "declined" | "conditioned" | "manual_review" | "pending" | "unknown" | (string & {});

export interface CreditApplication {
  id: string;
  application_id: string;
  tenant_id: string | null;
  applicant_name: string;
  applicant_email: string | null;
  applicant_phone: string | null;
  monthly_income: string | number | null;
  vehicle_vin: string | null;
  vehicle_year: number | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_price: string | number | null;
  requested_amount: string | null;
  down_payment: string | null;
  status: CreditApplicationStatus;
  score: number | null;
  risk_score: number | null;
  decision: CreditDecision | null;
  recommendation: string | null;
  created_at: string;
  updated_at: string;
  /** Server display_status when backend includes it on list/detail payloads. */
  display_status?: string | null;
  raw: unknown;
}

export interface CreditStats {
  total_applications: number;
  draft_applications: number;
  submitted_applications: number;
  processing_applications: number;
  approved_applications: number;
  rejected_applications: number;
  completed_applications?: number;
  applications_this_week: number;
  average_score: number | null;
  approval_rate: number | null;
  raw: unknown;
}

export interface CreditEvent {
  id: string;
  application_id: string | null;
  type: string;
  title: string;
  description: string | null;
  created_at: string;
  actor: string | null;
  metadata: Record<string, unknown> | null;
  raw: unknown;
}

export interface CreateCreditApplicationPayload {
  applicant: {
    full_name: string;
    document_type?: string;
    document_other_type?: string | null;
    identification: string;
    date_of_birth: string;
    age: string | number;
    marital_status: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    municipality?: string;
    province: string;
    country: string;
    referencias_personales?: Array<{
      nombre_completo: string;
      direccion: string;
      telefono: string;
    }>;
  };
  employment: {
    employment_type: string;
    employer_name: string;
    position: string;
    employment_start_date?: string;
    /** @deprecated Backend may still read; prefer employment_start_date (Sprint 7). */
    time_in_job?: string;
    employer_address?: string;
    employer_province?: string;
    employer_municipality?: string;
    contract_type?: string;
    monthly_income: string | number;
    has_other_income?: boolean;
    other_income: string | number;
    /** @deprecated Removed from Forge payload; retained optional for API tolerance. */
    payment_frequency?: string;
    work_phone: string;
  };
  financial: {
    requested_amount: string | number;
    desired_term: string;
    down_payment: string | number;
    monthly_debts: string | number;
    estimated_monthly_expenses: string | number;
    /** @deprecated Not sent from Forge wizard (Sprint 7). */
    primary_bank?: string | null;
    has_bank_account: boolean;
    has_late_payment_history: boolean;
    max_late_payment_days: string | number | null;
  };
  vehicle: {
    product_type: string;
    make: string;
    model: string;
    version?: string;
    year: string | number;
    color?: string | null;
    price: string | number;
    dealer_supplier: string;
    condition: string;
    mileage?: string | number | null;
  };
  co_debtor: {
    required: boolean;
    document_type?: string;
    document_other_type?: string | null;
    full_name: string;
    identification: string;
    date_of_birth?: string;
    email?: string;
    address?: string;
    province?: string;
    municipality?: string;
    phone: string;
    monthly_income: string | number;
    relationship: string;
    employment: string;
    employer_name?: string;
    employment_start_date?: string;
  };
  documents: {
    id_uploaded: boolean;
    income_proof_uploaded: boolean;
    bank_statement_uploaded: boolean;
    bureau_authorization_uploaded: boolean;
    invoice_uploaded: boolean;
    notes?: Record<string, string>;
    additional_documents?: string[];
  };
  consents: {
    presence?: "present" | "remote";
    bureau_authorization: boolean;
    terms_accepted: boolean;
    data_processing_authorization: boolean;
    consent_method?: string | null;
    consent_audit_hash?: string | null;
    consent_accepted_at?: string | null;
    signature_full_name?: string | null;
  };
  source: "forge_dealer_portal";
  version: "full_credit_application_v1";
  /** Per-document upload status (additive; backend persists PENDING for uploaded: false). */
  documentos?: Record<string, { uploaded: boolean; file_id?: string }>;
  /** Optional LATAM segment metadata (additive; backend may ignore until segmented-report). */
  segment?: {
    zone?: string;
    vehicle_type?: string;
    employment_type?: string;
  };
  /** Dealer sworn vehicle declaration (SECURITY_UI_LOOP F1). */
  declaracion_vehiculo?: {
    perdida_total: boolean;
    accidentes_reportados: "yes" | "no" | "unknown";
    gravamenes_vigentes: boolean;
    titulo_a_nombre_vendedor: boolean;
    kilometraje_coincide: boolean;
    firma_dealer: string;
    fecha_firma: string;
    hash: string;
  };
}

export interface ApiErrorShape {
  message: string;
  status: number;
  detail?: unknown;
}

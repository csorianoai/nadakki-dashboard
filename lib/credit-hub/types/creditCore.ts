export const DEFAULT_CREDIT_TENANT_ID = "0a91ee98-2dbe-46d0-a43c-3fc2dbd42242";

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
  requested_amount: string;
  down_payment: string | null;
  status: CreditApplicationStatus;
  score: number | null;
  risk_score: number | null;
  decision: CreditDecision | null;
  recommendation: string | null;
  created_at: string;
  updated_at: string;
  raw: unknown;
}

export interface CreditStats {
  total_applications: number;
  draft_applications: number;
  submitted_applications: number;
  processing_applications: number;
  approved_applications: number;
  rejected_applications: number;
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
  applicant_name: string;
  applicant_email?: string;
  applicant_phone?: string;
  monthly_income?: string | number;
  requested_amount?: string | number;
  vehicle_year?: number;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_price?: string | number;
  down_payment?: string | number;
  source: "forge_dealer_portal";
}

export interface ApiErrorShape {
  message: string;
  status: number;
  detail?: unknown;
}

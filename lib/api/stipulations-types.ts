export type StipulationStatus = "pending" | "uploaded" | "verified" | "rejected";

export interface CreditStipulation {
  id: string;
  application_id?: string;
  title?: string;
  description: string;
  status: StipulationStatus;
  document_id?: string;
  document_mime?: string;
  uploaded_at?: string;
  verified_at?: string;
  rejected_at?: string;
  reject_reason?: string;
  notes?: string;
  /** Backend stipulation type (EP-12a) */
  type?: string;
  dealer_id?: string;
  sla_deadline?: string;
}

export interface StipulationUploadLinkResult {
  stipulation_id: string;
  upload_url: string;
  token: string;
  expires_at: string;
  qr_payload: string;
}

export interface StipulationCreatePayload {
  type: string;
  description?: string;
  dealer_id: string;
  sla_hours?: number | null;
}

export type StipulationsApiRole = "BANK_ANALYST" | "TENANT_ADMIN";

export interface StipulationAuditEntry {
  id: string;
  at: string;
  actor?: string;
  action: string;
  detail?: string;
}

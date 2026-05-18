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
}

export interface StipulationAuditEntry {
  id: string;
  at: string;
  actor?: string;
  action: string;
  detail?: string;
}

export type StipulationsApiRole = "BANK_ANALYST" | "TENANT_ADMIN";

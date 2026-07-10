import { CHApiError, chFetch, type CHActorRole } from "./client";

/** True when operational endpoint is not deployed yet (contract-first graceful UI). */
export function isOperationalEndpointUnavailable(err: unknown): boolean {
  return err instanceof CHApiError && (err.status === 404 || err.status === 501);
}

// ── F1: Application edit ─────────────────────────────────────────────────────

export interface EditHistoryEntry {
  field: string;
  old_value?: unknown;
  new_value?: unknown;
  changed_by?: string;
  changed_at?: string;
}

export async function patchApplicationFields(params: {
  tenantId: string;
  applicationId: string;
  fields: Record<string, unknown>;
  actorRole?: CHActorRole;
}): Promise<{ ok?: boolean; updated_fields?: string[] }> {
  return chFetch(`/api/v2/credit/applications/${encodeURIComponent(params.applicationId)}/fields`, {
    tenantId: params.tenantId,
    actorRole: params.actorRole ?? "dealer",
    method: "PATCH",
    body: JSON.stringify({ fields: params.fields }),
  });
}

export async function getEditHistory(params: {
  tenantId: string;
  applicationId: string;
  actorRole?: CHActorRole;
}): Promise<{ entries?: EditHistoryEntry[] }> {
  return chFetch(`/api/v2/credit/applications/${encodeURIComponent(params.applicationId)}/edit-history`, {
    tenantId: params.tenantId,
    actorRole: params.actorRole ?? "dealer",
  });
}

export function modifiedFieldKeysFromHistory(entries: EditHistoryEntry[] | undefined): Set<string> {
  const keys = new Set<string>();
  for (const e of entries ?? []) {
    if (e.field?.trim()) keys.add(e.field.trim());
  }
  return keys;
}

// ── F2: Document requests ───────────────────────────────────────────────────

export type DocumentRequestStatus = "REQUESTED" | "UPLOADED" | "ACCEPTED" | "REJECTED";

export type DocumentRequestType =
  | "employment_letter"
  | "pay_stubs"
  | "bank_statements"
  | "tax_return"
  | "address_proof"
  | "other";

export interface DocumentRequestItem {
  id: string;
  document_type: DocumentRequestType | string;
  status: DocumentRequestStatus | string;
  message?: string;
  review_notes?: string;
  rejection_reason?: string;
  created_at?: string;
  updated_at?: string;
}

export async function getDocumentRequests(params: {
  tenantId: string;
  applicationId: string;
  actorRole?: CHActorRole;
}): Promise<{ requests?: DocumentRequestItem[] }> {
  return chFetch(`/api/v2/credit/applications/${encodeURIComponent(params.applicationId)}/document-requests`, {
    tenantId: params.tenantId,
    actorRole: params.actorRole ?? "bank_analyst",
  });
}

export async function postDocumentRequest(params: {
  tenantId: string;
  applicationId: string;
  document_type: string;
  message?: string;
}): Promise<DocumentRequestItem> {
  return chFetch(`/api/v2/credit/applications/${encodeURIComponent(params.applicationId)}/document-requests`, {
    tenantId: params.tenantId,
    actorRole: "bank_analyst",
    method: "POST",
    body: JSON.stringify({ document_type: params.document_type, message: params.message ?? "" }),
  });
}

export async function patchDocumentRequestUpload(params: {
  tenantId: string;
  applicationId: string;
  requestId: string;
  file_name?: string;
}): Promise<DocumentRequestItem> {
  return chFetch(
    `/api/v2/credit/applications/${encodeURIComponent(params.applicationId)}/document-requests/${encodeURIComponent(params.requestId)}/upload`,
    {
      tenantId: params.tenantId,
      actorRole: "dealer",
      method: "PATCH",
      body: JSON.stringify({ file_name: params.file_name ?? "upload.pdf" }),
    },
  );
}

export async function postDocumentRequestReview(params: {
  tenantId: string;
  applicationId: string;
  requestId: string;
  action: "accept" | "reject";
  notes?: string;
  rejection_reason?: string;
}): Promise<DocumentRequestItem> {
  return chFetch(
    `/api/v2/credit/applications/${encodeURIComponent(params.applicationId)}/document-requests/${encodeURIComponent(params.requestId)}/review`,
    {
      tenantId: params.tenantId,
      actorRole: "bank_analyst",
      method: "POST",
      body: JSON.stringify({
        action: params.action,
        notes: params.notes,
        rejection_reason: params.rejection_reason,
      }),
    },
  );
}

// ── F3: Messaging ───────────────────────────────────────────────────────────

export interface ApplicationMessage {
  id: string;
  sender_role: "dealer" | "bank" | string;
  message_text: string;
  created_at: string;
  read?: boolean;
}

export async function getApplicationMessages(params: {
  tenantId: string;
  applicationId: string;
  actorRole?: CHActorRole;
}): Promise<{ messages?: ApplicationMessage[]; unread_count?: number }> {
  return chFetch(`/api/v2/credit/applications/${encodeURIComponent(params.applicationId)}/messages`, {
    tenantId: params.tenantId,
    actorRole: params.actorRole ?? "dealer",
  });
}

export async function postApplicationMessage(params: {
  tenantId: string;
  applicationId: string;
  message_text: string;
  actorRole?: CHActorRole;
}): Promise<ApplicationMessage> {
  return chFetch(`/api/v2/credit/applications/${encodeURIComponent(params.applicationId)}/messages`, {
    tenantId: params.tenantId,
    actorRole: params.actorRole ?? "dealer",
    method: "POST",
    body: JSON.stringify({ message_text: params.message_text }),
  });
}

export async function patchMarkMessagesRead(params: {
  tenantId: string;
  applicationId: string;
  actorRole?: CHActorRole;
}): Promise<{ ok?: boolean }> {
  return chFetch(`/api/v2/credit/applications/${encodeURIComponent(params.applicationId)}/messages/read`, {
    tenantId: params.tenantId,
    actorRole: params.actorRole ?? "dealer",
    method: "PATCH",
    body: JSON.stringify({}),
  });
}

// ── F4: Post-approval / disbursement ────────────────────────────────────────

export async function postReadyForDisbursement(params: {
  tenantId: string;
  applicationId: string;
}): Promise<{ display_status?: string }> {
  return chFetch(`/api/v2/credit/applications/${encodeURIComponent(params.applicationId)}/ready-for-disbursement`, {
    tenantId: params.tenantId,
    actorRole: "bank_analyst",
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function postDisburse(params: {
  tenantId: string;
  applicationId: string;
  disbursement_reference: string;
}): Promise<{ display_status?: string; disbursement_reference?: string }> {
  return chFetch(`/api/v2/credit/applications/${encodeURIComponent(params.applicationId)}/disburse`, {
    tenantId: params.tenantId,
    actorRole: "bank_analyst",
    method: "POST",
    body: JSON.stringify({ disbursement_reference: params.disbursement_reference }),
  });
}

// ── F5: Cancel ────────────────────────────────────────────────────────────────

export async function postCancelApplication(params: {
  tenantId: string;
  applicationId: string;
  reason: string;
}): Promise<{ display_status?: string; cancel_reason?: string }> {
  return chFetch(`/api/v2/credit/applications/${encodeURIComponent(params.applicationId)}/cancel`, {
    tenantId: params.tenantId,
    actorRole: "dealer",
    method: "POST",
    body: JSON.stringify({ reason: params.reason }),
  });
}

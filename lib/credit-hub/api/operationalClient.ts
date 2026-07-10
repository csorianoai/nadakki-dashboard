import { CHApiError, chFetch, type CHActorRole } from "./client";

/** True when operational endpoint is not deployed yet (contract-first graceful UI). */
export function isOperationalEndpointUnavailable(err: unknown): boolean {
  return err instanceof CHApiError && (err.status === 404 || err.status === 501);
}

function senderTypeForRole(actorRole?: CHActorRole): "DEALER" | "BANK" {
  return actorRole === "dealer" ? "DEALER" : "BANK";
}

function readerTypeForRole(actorRole?: CHActorRole): "DEALER" | "BANK" {
  return actorRole === "dealer" ? "DEALER" : "BANK";
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
  requestId: string;
}): Promise<DocumentRequestItem> {
  return chFetch(`/api/v2/credit/document-requests/${encodeURIComponent(params.requestId)}/upload`, {
    tenantId: params.tenantId,
    actorRole: "dealer",
    method: "PATCH",
    body: JSON.stringify({}),
  });
}

export async function patchDocumentRequestReview(params: {
  tenantId: string;
  requestId: string;
  decision: "ACCEPTED" | "REJECTED";
  notes?: string;
}): Promise<DocumentRequestItem> {
  return chFetch(`/api/v2/credit/document-requests/${encodeURIComponent(params.requestId)}/review`, {
    tenantId: params.tenantId,
    actorRole: "bank_analyst",
    method: "PATCH",
    body: JSON.stringify({ decision: params.decision, notes: params.notes }),
  });
}

// ── F3: Messaging ───────────────────────────────────────────────────────────

export interface ApplicationMessage {
  id: string;
  sender_role: "dealer" | "bank" | "DEALER" | "BANK" | string;
  message_text: string;
  created_at: string;
  read?: boolean;
}

function normalizeMessage(raw: {
  id: string;
  sender_type?: string;
  message_text: string;
  created_at: string;
  read_at?: string | null;
}): ApplicationMessage {
  const role = (raw.sender_type ?? "DEALER").toUpperCase();
  return {
    id: raw.id,
    sender_role: role === "BANK" ? "bank" : "dealer",
    message_text: raw.message_text,
    created_at: raw.created_at,
    read: Boolean(raw.read_at),
  };
}

export async function getApplicationMessages(params: {
  tenantId: string;
  applicationId: string;
  actorRole?: CHActorRole;
}): Promise<{ messages?: ApplicationMessage[] }> {
  const data = await chFetch<{
    messages?: Array<{
      id: string;
      sender_type?: string;
      message_text: string;
      created_at: string;
      read_at?: string | null;
    }>;
  }>(`/api/v2/credit/applications/${encodeURIComponent(params.applicationId)}/messages`, {
    tenantId: params.tenantId,
    actorRole: params.actorRole ?? "dealer",
  });
  return { messages: (data.messages ?? []).map(normalizeMessage) };
}

export async function postApplicationMessage(params: {
  tenantId: string;
  applicationId: string;
  message_text: string;
  actorRole?: CHActorRole;
}): Promise<ApplicationMessage> {
  const raw = await chFetch<{
    id: string;
    sender_type?: string;
    message_text: string;
    created_at: string;
    read_at?: string | null;
  }>(`/api/v2/credit/applications/${encodeURIComponent(params.applicationId)}/messages`, {
    tenantId: params.tenantId,
    actorRole: params.actorRole ?? "dealer",
    method: "POST",
    body: JSON.stringify({
      sender_type: senderTypeForRole(params.actorRole),
      message_text: params.message_text,
    }),
  });
  return normalizeMessage(raw);
}

export async function patchMarkMessageRead(params: {
  tenantId: string;
  messageId: string;
  actorRole?: CHActorRole;
}): Promise<{ ok?: boolean; read?: boolean }> {
  return chFetch(`/api/v2/credit/messages/${encodeURIComponent(params.messageId)}/read`, {
    tenantId: params.tenantId,
    actorRole: params.actorRole ?? "dealer",
    method: "PATCH",
    body: JSON.stringify({}),
  });
}

export async function getMessageUnreadCount(params: {
  tenantId: string;
  applicationId: string;
  actorRole?: CHActorRole;
}): Promise<number> {
  const readerType = readerTypeForRole(params.actorRole);
  const data = await chFetch<{ unread_count?: number }>(
    `/api/v2/credit/applications/${encodeURIComponent(params.applicationId)}/messages/unread-count?reader_type=${readerType}`,
    {
      tenantId: params.tenantId,
      actorRole: params.actorRole ?? "dealer",
    },
  );
  return data.unread_count ?? 0;
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

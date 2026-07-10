import { CHApiError, chFetch, type CHActorRole } from "./client";

/** True when bank-experience endpoint is not deployed yet (contract-first graceful UI). */
export function isBankExperienceEndpointUnavailable(err: unknown): boolean {
  return err instanceof CHApiError && (err.status === 404 || err.status === 501);
}

// ── F1: Internal notes ────────────────────────────────────────────────────────

export type NoteCategory = "GENERAL" | "RIESGO" | "COMPLIANCE" | "SEGUIMIENTO";

export interface ApplicationNote {
  id: string;
  author_name: string;
  author_initials?: string;
  category: NoteCategory | string;
  text: string;
  created_at: string;
}

export async function getApplicationNotes(params: {
  tenantId: string;
  applicationId: string;
  actorRole?: CHActorRole;
}): Promise<{ notes?: ApplicationNote[] }> {
  return chFetch(`/api/v2/credit/applications/${encodeURIComponent(params.applicationId)}/notes`, {
    tenantId: params.tenantId,
    actorRole: params.actorRole ?? "bank_analyst",
  });
}

export async function postApplicationNote(params: {
  tenantId: string;
  applicationId: string;
  category: NoteCategory;
  text: string;
  actorRole?: CHActorRole;
}): Promise<ApplicationNote> {
  return chFetch(`/api/v2/credit/applications/${encodeURIComponent(params.applicationId)}/notes`, {
    tenantId: params.tenantId,
    actorRole: params.actorRole ?? "bank_analyst",
    method: "POST",
    body: JSON.stringify({ category: params.category, text: params.text }),
  });
}

// ── F1: Analyst assignment ────────────────────────────────────────────────────

export interface ApplicationAssignment {
  analyst_name: string;
  analyst_id?: string;
  assigned_at?: string;
}

export interface AssignmentHistoryEntry {
  analyst_name: string;
  assigned_at: string;
  notes?: string;
  assigned_by?: string;
}

export async function getApplicationAssignment(params: {
  tenantId: string;
  applicationId: string;
  actorRole?: CHActorRole;
}): Promise<{ current?: ApplicationAssignment; history?: AssignmentHistoryEntry[] }> {
  return chFetch(`/api/v2/credit/applications/${encodeURIComponent(params.applicationId)}/assignment`, {
    tenantId: params.tenantId,
    actorRole: params.actorRole ?? "bank_analyst",
  });
}

export async function postReassignApplication(params: {
  tenantId: string;
  applicationId: string;
  analyst_name: string;
  notes?: string;
}): Promise<{ current?: ApplicationAssignment }> {
  return chFetch(`/api/v2/credit/applications/${encodeURIComponent(params.applicationId)}/assign`, {
    tenantId: params.tenantId,
    actorRole: "bank_admin",
    method: "POST",
    body: JSON.stringify({ analyst_name: params.analyst_name, notes: params.notes ?? "" }),
  });
}

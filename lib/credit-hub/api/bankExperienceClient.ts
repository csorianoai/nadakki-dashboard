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

// ── F2: Amortization schedule ─────────────────────────────────────────────────

export interface AmortizationScheduleRow {
  period: number;
  due_date: string;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export async function getAmortizationSchedule(params: {
  tenantId: string;
  applicationId: string;
  actorRole?: CHActorRole;
}): Promise<{ schedule?: AmortizationScheduleRow[]; currency?: string }> {
  return chFetch(`/api/v2/credit/applications/${encodeURIComponent(params.applicationId)}/amortization`, {
    tenantId: params.tenantId,
    actorRole: params.actorRole ?? "dealer",
  });
}

// ── F2: Conditions + offer validity ─────────────────────────────────────────────

export interface ApplicationCondition {
  id: string;
  text: string;
  status: "pending" | "satisfied" | string;
}

export async function getApplicationConditions(params: {
  tenantId: string;
  applicationId: string;
  actorRole?: CHActorRole;
}): Promise<{ conditions?: ApplicationCondition[]; valid_until?: string | null }> {
  return chFetch(`/api/v2/credit/applications/${encodeURIComponent(params.applicationId)}/conditions`, {
    tenantId: params.tenantId,
    actorRole: params.actorRole ?? "bank_analyst",
  });
}

export async function patchApplicationConditions(params: {
  tenantId: string;
  applicationId: string;
  conditions: ApplicationCondition[];
}): Promise<{ conditions?: ApplicationCondition[]; valid_until?: string | null }> {
  return chFetch(`/api/v2/credit/applications/${encodeURIComponent(params.applicationId)}/conditions`, {
    tenantId: params.tenantId,
    actorRole: "bank_analyst",
    method: "PATCH",
    body: JSON.stringify({ conditions: params.conditions }),
  });
}

// ── F3: Counter-offer detail + offer compare ──────────────────────────────────

export interface OfferCompareRow {
  lender_code: string;
  lender_display_name?: string;
  amount?: number;
  rate_apr?: number;
  term_months?: number;
  monthly_payment?: number;
  rank?: number;
  is_best?: boolean;
}

export async function getOfferCompare(params: {
  tenantId: string;
  applicationId: string;
  actorRole?: CHActorRole;
}): Promise<{ offers?: OfferCompareRow[]; generated_at?: string }> {
  return chFetch(`/api/v2/credit/applications/${encodeURIComponent(params.applicationId)}/offers/compare`, {
    tenantId: params.tenantId,
    actorRole: params.actorRole ?? "bank_analyst",
  });
}

// ── F4: Bank experience KPIs ──────────────────────────────────────────────────

export interface BankExperienceKpi {
  key: string;
  label: string;
  value: number | string | null;
  unit?: string;
}

export async function getBankExperienceKpis(params: {
  tenantId: string;
  period?: "today" | "week" | "month" | string;
}): Promise<{ kpis?: BankExperienceKpi[]; period?: string }> {
  const query = params.period ? `?period=${encodeURIComponent(params.period)}` : "";
  return chFetch(`/api/v2/credit/analytics/bank-kpis${query}`, {
    tenantId: params.tenantId,
    actorRole: "bank_admin",
  });
}

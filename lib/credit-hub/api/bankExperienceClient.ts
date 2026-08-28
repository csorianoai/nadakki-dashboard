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

// ── F2: Amortization schedule (offer-scoped) ──────────────────────────────────

export interface AmortizationScheduleRow {
  period: number;
  due_date: string;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

function mapAmortizationRow(raw: Record<string, unknown>): AmortizationScheduleRow {
  return {
    period: Number(raw.periodo ?? raw.period ?? 0),
    due_date: String(raw.due_date ?? raw.fecha ?? ""),
    payment: Number(raw.cuota ?? raw.payment ?? 0),
    principal: Number(raw.capital ?? raw.principal ?? 0),
    interest: Number(raw.interes ?? raw.interest ?? 0),
    balance: Number(raw.saldo ?? raw.balance ?? 0),
  };
}

export async function getAmortizationSchedule(params: {
  tenantId: string;
  applicationId: string;
  offerId: string;
  actorRole?: CHActorRole;
}): Promise<{ schedule?: AmortizationScheduleRow[]; currency?: string }> {
  const data = await chFetch<{ schedule?: Array<Record<string, unknown>>; currency?: string }>(
    `/api/v2/credit/applications/${encodeURIComponent(params.applicationId)}/offers/${encodeURIComponent(params.offerId)}/amortization`,
    {
      tenantId: params.tenantId,
      actorRole: params.actorRole ?? "dealer",
    },
  );
  return {
    currency: data.currency,
    schedule: (data.schedule ?? []).map(mapAmortizationRow),
  };
}

// ── F2: Conditions (offer-scoped) ─────────────────────────────────────────────

export interface OfferCondition {
  key: string;
  label_es: string;
  met: boolean;
  detail?: string | null;
}

export async function getOfferConditions(params: {
  tenantId: string;
  applicationId: string;
  offerId: string;
  actorRole?: CHActorRole;
}): Promise<{ conditions?: OfferCondition[]; valid_until?: string | null; expires_at?: string | null }> {
  return chFetch(
    `/api/v2/credit/applications/${encodeURIComponent(params.applicationId)}/offers/${encodeURIComponent(params.offerId)}/conditions`,
    {
      tenantId: params.tenantId,
      actorRole: params.actorRole ?? "bank_analyst",
    },
  );
}

export async function putOfferConditions(params: {
  tenantId: string;
  applicationId: string;
  offerId: string;
  conditions: OfferCondition[];
}): Promise<{ conditions?: OfferCondition[]; valid_until?: string | null }> {
  return chFetch(
    `/api/v2/credit/applications/${encodeURIComponent(params.applicationId)}/offers/${encodeURIComponent(params.offerId)}/conditions`,
    {
      tenantId: params.tenantId,
      actorRole: "bank_analyst",
      method: "PUT",
      body: JSON.stringify({ conditions: params.conditions }),
    },
  );
}

/** Fulfill/unfulfill a condition via PUT (backend has no separate /fulfill route). */
export async function fulfillOfferCondition(params: {
  tenantId: string;
  applicationId: string;
  offerId: string;
  index: number;
  met: boolean;
}): Promise<{ conditions?: OfferCondition[] }> {
  const current = await getOfferConditions({
    tenantId: params.tenantId,
    applicationId: params.applicationId,
    offerId: params.offerId,
  });
  const conditions = [...(current.conditions ?? [])];
  if (params.index < 0 || params.index >= conditions.length) {
    throw new CHApiError("CONDITION_INDEX_OUT_OF_RANGE", 422);
  }
  conditions[params.index] = { ...conditions[params.index], met: params.met };
  return putOfferConditions({
    tenantId: params.tenantId,
    applicationId: params.applicationId,
    offerId: params.offerId,
    conditions,
  });
}

// ── F3: Counter-offer detail + offer compare + reject ─────────────────────────

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

export interface OfferCompareDetail {
  offer_id: string;
  lender_code?: string;
  lender_display_name?: string;
  offer_status?: string;
  is_counteroffer?: boolean;
  terms?: Record<string, unknown>;
}

export async function getOfferCompare(params: {
  tenantId: string;
  applicationId: string;
  actorRole?: CHActorRole;
}): Promise<{ offer_count?: number; offers?: OfferCompareRow[]; offers_detail?: OfferCompareDetail[]; generated_at?: string }> {
  return chFetch(`/api/v2/credit/applications/${encodeURIComponent(params.applicationId)}/offers/compare`, {
    tenantId: params.tenantId,
    actorRole: params.actorRole ?? "bank_analyst",
  });
}

export async function postRejectOffer(params: {
  tenantId: string;
  applicationId: string;
  offerId: string;
  reason?: string;
  actorRole?: CHActorRole;
}): Promise<{ ok?: boolean; offer_id?: string }> {
  return chFetch(
    `/api/v2/credit/applications/${encodeURIComponent(params.applicationId)}/offers/${encodeURIComponent(params.offerId)}/reject`,
    {
      tenantId: params.tenantId,
      actorRole: params.actorRole ?? "dealer",
      method: "POST",
      body: JSON.stringify({ reason: params.reason ?? "" }),
    },
  );
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
}): Promise<{ kpis?: BankExperienceKpi[] }> {
  const [portfolio, approval] = await Promise.all([
    chFetch<{
      total_applications?: number;
      accepted_offers?: number;
      pending_offers?: number;
      total_approved_amount?: number;
    }>("/api/v2/credit/bank/kpis/portfolio", {
      tenantId: params.tenantId,
      actorRole: "bank_admin",
    }),
    chFetch<{
      approval_rate_pct?: number;
      avg_response_hours?: number | null;
      approved_count?: number;
      declined_count?: number;
    }>("/api/v2/credit/bank/kpis/approval", {
      tenantId: params.tenantId,
      actorRole: "bank_admin",
    }),
  ]);

  const kpis: BankExperienceKpi[] = [
    { key: "total_applications", label: "Solicitudes", value: portfolio.total_applications ?? 0 },
    { key: "accepted_offers", label: "Ofertas aceptadas", value: portfolio.accepted_offers ?? 0 },
    { key: "pending_offers", label: "Ofertas pendientes", value: portfolio.pending_offers ?? 0 },
    {
      key: "approved_amount",
      label: "Monto aprobado",
      value: portfolio.total_approved_amount ?? 0,
      unit: "DOP",
    },
    { key: "approval_rate", label: "Tasa aprobación", value: approval.approval_rate_pct ?? 0, unit: "%" },
    {
      key: "avg_response",
      label: "Respuesta prom.",
      value: approval.avg_response_hours ?? null,
      unit: "h",
    },
    { key: "approved_count", label: "Aprobadas", value: approval.approved_count ?? 0 },
    { key: "declined_count", label: "Rechazadas", value: approval.declined_count ?? 0 },
  ];

  return { kpis };
}

// ── F5: Export PDF + queue Excel ──────────────────────────────────────────────

export function expedientePdfPath(applicationId: string): string {
  return `/api/v2/credit/applications/${encodeURIComponent(applicationId)}/export/expediente.pdf`;
}

export function decisionLetterPdfPath(applicationId: string, offerId: string): string {
  const base = `/api/v2/credit/applications/${encodeURIComponent(applicationId)}/export/decision-letter.pdf`;
  return `${base}?offer_id=${encodeURIComponent(offerId)}`;
}

export function auditTrailPdfPath(applicationId: string): string {
  return `/api/v2/credit/applications/${encodeURIComponent(applicationId)}/export/audit-trail.pdf`;
}

export function bankQueueExcelPath(): string {
  return "/api/v2/credit/bank/export/queue.xlsx";
}

import { apiFetch, getAuthHeaders } from "@/lib/api/fetch-client";

/** ROP-P2-VISITA-API: POST de un evento kind=showing. El tenant NUNCA viaja desde aquí: sale del token en el servidor. */
export const VISIT_PATH = "/api/v1/realestate/calendar/events";
const REMINDERS_MIN = [60];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type VisitForm = { title: string; startsAt: string; endsAt: string; propertyId: string; contactId: string };
export type VisitResult = { ok: true } | { ok: false; reason: "conflict" | "invalid" | "denied" | "error" };

export type VisitBody = {
  kind: "showing"; title: string; starts_at: string; ends_at: string; timezone: string;
  property_id: string; contact_id: string; operation_id: string; reminders: number[]; allow_overlap?: true;
};

/** `datetime-local` (hora de pared del navegador) → instante UTC con «Z», como exige el contrato. */
const toUtc = (local: string): string | null => {
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

/** Válido si hay título, ids uuid y fin posterior al inicio; si no, null (fail-closed, no se llama al backend). */
export function validVisit(f: VisitForm): boolean {
  const s = toUtc(f.startsAt);
  const e = toUtc(f.endsAt);
  return !!f.title.trim() && UUID.test(f.propertyId.trim()) && UUID.test(f.contactId.trim()) && !!s && !!e && e > s;
}

export function buildVisitBody(f: VisitForm, timezone: string, operationId: string, allowOverlap = false): VisitBody {
  return {
    kind: "showing", title: f.title.trim(), starts_at: toUtc(f.startsAt) ?? "", ends_at: toUtc(f.endsAt) ?? "", timezone,
    property_id: f.propertyId.trim(), contact_id: f.contactId.trim(), operation_id: operationId, reminders: REMINDERS_MIN,
    ...(allowOverlap ? { allow_overlap: true as const } : {}),
  };
}

const newOperationId = (): string => globalThis.crypto.randomUUID();

/** `operationId` estable entre el intento y el reintento tras 409 (idempotencia del alta). */
export async function createVisit(f: VisitForm, opts: { allowOverlap?: boolean; operationId?: string } = {}): Promise<VisitResult> {
  if (!validVisit(f)) return { ok: false, reason: "invalid" };
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const body = buildVisitBody(f, tz, opts.operationId ?? newOperationId(), opts.allowOverlap);
  try {
    const res = await apiFetch(VISIT_PATH, {
      method: "POST", cache: "no-store",
      headers: { Accept: "application/json", "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(body),
    });
    if (res.status === 201) return { ok: true };
    if (res.status === 409) return { ok: false, reason: "conflict" };
    if (res.status === 422) return { ok: false, reason: "invalid" };
    if (res.status === 401 || res.status === 403) return { ok: false, reason: "denied" };
    return { ok: false, reason: "error" };
  } catch {
    return { ok: false, reason: "error" };
  }
}

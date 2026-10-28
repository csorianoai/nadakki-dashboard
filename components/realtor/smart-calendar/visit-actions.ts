import { apiFetch, getAuthHeaders } from "@/lib/api/fetch-client";
import { CALENDAR_PATH, weekRange } from "@/lib/realtor/smart-calendar/api";

/** ROP-G5-VISITA-MOVER-API: PATCH /events/{id} (mover) y POST /events/{id}/followup. El tenant NUNCA viaja desde aquí: sale del token en el servidor. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PAGE_LIMIT = 200;
const MAX_PAGES = 5;

export type Outcome = "confirmed" | "completed" | "no_show";
export type ActionResult = { ok: true } | { ok: false; reason: "conflict" | "invalid" | "denied" | "notfound" | "error" };
export type VisitMeta = { startsAt: string; endsAt: string };

const toUtc = (local: string): string | null => {
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

async function send(path: string, method: "PATCH" | "POST", body: unknown): Promise<ActionResult> {
  try {
    const res = await apiFetch(path, {
      method, cache: "no-store",
      headers: { Accept: "application/json", "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(body),
    });
    if (res.status === 200) return { ok: true };
    if (res.status === 401 || res.status === 403) return { ok: false, reason: "denied" };
    if (res.status === 404) return { ok: false, reason: "notfound" };
    if (res.status === 409) return { ok: false, reason: "conflict" };
    if (res.status === 422) return { ok: false, reason: "invalid" };
    return { ok: false, reason: "error" };
  } catch {
    return { ok: false, reason: "error" };
  }
}

/** Fin posterior al inicio, instantes UTC con «Z»; si no, no se llama al backend (fail-closed). */
export async function moveVisit(id: string, f: { startsAt: string; endsAt: string }, allowOverlap = false): Promise<ActionResult> {
  const s = toUtc(f.startsAt);
  const e = toUtc(f.endsAt);
  if (!UUID.test(id) || !s || !e || e <= s) return { ok: false, reason: "invalid" };
  return send(`${CALENDAR_PATH}/${id}`, "PATCH", { starts_at: s, ends_at: e, ...(allowOverlap ? { allow_overlap: true } : {}) });
}

export async function followUpVisit(id: string, outcome: Outcome): Promise<ActionResult> {
  if (!UUID.test(id)) return { ok: false, reason: "invalid" };
  return send(`${CALENDAR_PATH}/${id}/followup`, "POST", { outcome });
}

/** Visitas (kind=showing) aún abiertas de la semana, con sus instantes reales. Solo estas admiten mover/seguimiento. Fallo → vacío. */
export async function fetchOpenVisits(now: Date = new Date()): Promise<Record<string, VisitMeta>> {
  const { from, to } = weekRange(now);
  const out: Record<string, VisitMeta> = {};
  let cursor: string | null = null;
  try {
    for (let i = 0; i < MAX_PAGES; i++) {
      const q = new URLSearchParams({ from: from.toISOString(), to: to.toISOString(), limit: String(PAGE_LIMIT) });
      if (cursor) q.set("cursor", cursor);
      const res = await apiFetch(`${CALENDAR_PATH}?${q}`, { method: "GET", cache: "no-store", headers: { Accept: "application/json", ...getAuthHeaders() } });
      if (res.status !== 200) return {};
      const body = (await res.json()) as { items?: unknown; next_cursor?: unknown };
      if (!Array.isArray(body.items)) return {};
      for (const e of body.items as Record<string, unknown>[]) {
        if (e && e.kind === "showing" && (e.status === "scheduled" || e.status === "confirmed")
          && typeof e.id === "string" && typeof e.starts_at === "string" && typeof e.ends_at === "string") {
          out[e.id] = { startsAt: e.starts_at, endsAt: e.ends_at };
        }
      }
      cursor = typeof body.next_cursor === "string" && body.next_cursor ? body.next_cursor : null;
      if (!cursor) break;
    }
  } catch {
    return {};
  }
  return out;
}

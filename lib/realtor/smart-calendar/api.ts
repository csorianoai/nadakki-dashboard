import { apiFetch, getAuthHeaders } from "@/lib/api/fetch-client";
import type { CalEvent, EventKind } from "./types";

/** C-RE-OLA3 1.0.0 (congelado), C-RE-CALENDARIO, solo lectura. El tenant NUNCA viaja desde aquí: sale del token en el servidor. */
export const CALENDAR_PATH = "/api/v1/realestate/calendar/events";
const PAGE_LIMIT = 200;
const MAX_PAGES = 5;

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);

/** CalendarEventKind del contrato → los dos tipos de la pantalla. */
const KIND_MAP: Record<string, EventKind> = {
  showing: "visita", open_house: "visita",
  meeting: "cita", call: "cita", signing: "cita", inspection: "cita", task: "cita", other: "cita",
};
const STATUSES = new Set(["scheduled", "confirmed", "completed", "no_show"]);

/** Lunes 00:00 local de la semana de `now` y el lunes siguiente. */
export function weekRange(now: Date): { from: Date; to: Date } {
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  return { from, to: new Date(from.getFullYear(), from.getMonth(), from.getDate() + 7) };
}

/** Hora de pared del evento en su zona: día de la semana (0 = lunes) y "HH:MM". Zona inválida → null. */
function wallClock(iso: string, timeZone: string): { day: number; start: string } | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  try {
    const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
      timeZone, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit",
    }).formatToParts(d).map((p) => [p.type, p.value]));
    const wd = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day))).getUTCDay();
    return { day: (wd + 6) % 7, start: `${parts.hour}:${parts.minute}` };
  } catch {
    return null;
  }
}

/** CalendarEvent → vista. Fila inválida o cancelada se descarta (fail-closed), nunca se inventa. */
export function mapEvents(items: readonly unknown[]): CalEvent[] {
  const out: CalEvent[] = [];
  for (const e of items) {
    if (!isObj(e)) continue;
    const id = str(e.id);
    const title = str(e.title);
    const kind = KIND_MAP[String(e.kind)];
    const startsAt = str(e.starts_at);
    const tz = str(e.timezone);
    if (!id || !title || !kind || !startsAt || !tz || !STATUSES.has(String(e.status))) continue;
    const wall = wallClock(startsAt, tz);
    if (!wall) continue;
    out.push({ id, day: wall.day, start: e.all_day === true ? "00:00" : wall.start, title: { es: title, en: title }, kind, place: "" });
  }
  return out;
}

/** Sigue next_cursor hasta MAX_PAGES. 404, 503, cuerpo ilegible o fallo de red → lista vacía («Sin datos todavía»). */
export async function fetchCalendarEvents(now: Date = new Date()): Promise<CalEvent[]> {
  const { from, to } = weekRange(now);
  const items: unknown[] = [];
  let cursor: string | null = null;
  try {
    for (let i = 0; i < MAX_PAGES; i++) {
      const q = new URLSearchParams({ from: from.toISOString(), to: to.toISOString(), limit: String(PAGE_LIMIT) });
      if (cursor) q.set("cursor", cursor);
      const res = await apiFetch(`${CALENDAR_PATH}?${q}`, { method: "GET", cache: "no-store", headers: { Accept: "application/json", ...getAuthHeaders() } });
      if (res.status !== 200) return [];
      const body: unknown = await res.json();
      if (!isObj(body) || !Array.isArray(body.items)) return [];
      items.push(...body.items);
      cursor = str(body.next_cursor);
      if (!cursor) break;
    }
  } catch {
    return [];
  }
  return mapEvents(items);
}

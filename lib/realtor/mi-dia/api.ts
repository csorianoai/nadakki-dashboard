import { apiFetch, getAuthHeaders } from "@/lib/api/fetch-client";

/** Ruta de C-RE-OLA2 (getMiDia). Tenant y usuario salen del token en el servidor: el cliente no envía ninguno. */
export const MI_DIA_PATH = "/api/v1/realestate/mi-dia";

export type Quality = "OK" | "NO_DISPONIBLE";
export type Section<T> = { quality: Quality; count: number | null; items: T[] };
export type LeadItem = { lead_id: string; channel: string; intent: string; status: string; received_at: string; waiting_hours: number };
export type ListingItem = { listing_id: string; stage_key: string; blocking_count: number };
export type DeskItem = { item_id: string; kind: string; created_at: string };
export type VisitItem = { visit_id: string; listing_id: string; scheduled_at: string; status: string };
export type MiDia = {
  scope: "agent" | "supervisor";
  leads: Section<LeadItem>;
  listings: Section<ListingItem>;
  desk: Section<DeskItem>;
  visitas: Section<VisitItem>;
};

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

function section<T>(v: unknown, ok: (i: unknown) => i is T): Section<T> | null {
  if (!isObj(v) || !Array.isArray(v.items)) return null;
  if (v.quality === "NO_DISPONIBLE") return { quality: "NO_DISPONIBLE", count: null, items: [] };
  if (v.quality !== "OK" || typeof v.count !== "number") return null;
  return { quality: "OK", count: v.count, items: v.items.filter(ok) };
}

const isLead = (i: unknown): i is LeadItem =>
  isObj(i) && typeof i.lead_id === "string" && typeof i.channel === "string" && typeof i.intent === "string"
  && typeof i.status === "string" && typeof i.received_at === "string" && typeof i.waiting_hours === "number";
const isListing = (i: unknown): i is ListingItem =>
  isObj(i) && typeof i.listing_id === "string" && typeof i.stage_key === "string" && typeof i.blocking_count === "number";
const isDesk = (i: unknown): i is DeskItem =>
  isObj(i) && typeof i.item_id === "string" && typeof i.kind === "string" && typeof i.created_at === "string";

const isVisit = (i: unknown): i is VisitItem =>
  isObj(i) && typeof i.visit_id === "string" && typeof i.listing_id === "string"
  && typeof i.scheduled_at === "string" && typeof i.status === "string";

const SIN_FUENTE: Section<never> = { quality: "NO_DISPONIBLE", count: null, items: [] };

/** Cuerpo del contrato → vista. Cualquier forma inesperada devuelve null (fail-closed: «Sin datos todavía»). */
export function parseMiDia(body: unknown): MiDia | null {
  if (!isObj(body) || (body.scope !== "agent" && body.scope !== "supervisor")) return null;
  const leads = section(body.leads_sin_primera_respuesta, isLead);
  const listings = section(body.listings_con_requisitos_bloqueantes, isListing);
  const desk = section(body.broker_desk_pendientes, isDesk);
  // ROP-G5-MIDIA-VISITAS-API: si el servidor aún no envía la sección, es NO_DISPONIBLE (nunca visitas inventadas).
  const visitas = body.visitas_del_dia === undefined ? SIN_FUENTE : section(body.visitas_del_dia, isVisit);
  return leads && listings && desk && visitas ? { scope: body.scope, leads, listings, desk, visitas } : null;
}

/** true si alguna sección trae registros reales. Con todo vacío o no disponible, la pantalla queda en «Sin datos todavía». */
export function hasData(d: MiDia): boolean {
  return [d.leads, d.listings, d.desk, d.visitas].some((s) => s.quality === "OK" && s.items.length > 0);
}

/** 404, 503, red caída, cuerpo inválido o sin registros → null. */
export async function fetchMiDia(): Promise<MiDia | null> {
  try {
    const res = await apiFetch(MI_DIA_PATH, { method: "GET", cache: "no-store", headers: getAuthHeaders() });
    if (res.status !== 200) return null;
    const d = parseMiDia(await res.json());
    return d && hasData(d) ? d : null;
  } catch {
    return null;
  }
}

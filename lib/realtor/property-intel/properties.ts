import { apiFetch, getAuthHeaders } from "@/lib/api/fetch-client";
import { statusToState } from "./client";
import type { Section } from "./types";

/** Lista de propiedades del tenant (C-RE-OLA2 1.0.0, PropertySummary). El tenant sale del token en el servidor, nunca de aquí. */
const BASE = "/api/v1/realestate/properties";
const PAGE_LIMIT = 200;
const MAX_PAGES = 5;
/** Calle del detalle (DECISION_CESAR 2026-10-20, #2159): una lectura por propiedad, con tope. */
const MAX_DETAILS = 50;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type PiProperty = { id: string; address: string; street: string | null; type: string; units: number };

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);

/** Las listas llegan solo hasta `zone` (sin calle ni número, por contrato): zona, ciudad, región, país. */
export function addressLabel(a: unknown): string | null {
  if (!isObj(a)) return null;
  const parts = [a.zone, a.city, a.region, a.country].map(str).filter((x): x is string => x !== null);
  return parts.length ? parts.join(", ") : null;
}

/** Fila inválida (sin UUID o sin dirección) → se descarta; nunca se inventa. */
export function mapProperty(p: unknown): PiProperty | null {
  if (!isObj(p)) return null;
  const id = str(p.id);
  const address = addressLabel(p.address);
  if (!id || !UUID.test(id) || !address) return null;
  const units = Number.isInteger(p.unit_count) ? (p.unit_count as number) : 0;
  return { id, address, street: null, type: str(p.property_type) ?? "other", units };
}

/** La lista no trae calle (C-RE-OLA2); el detalle sí. Si el detalle falla, queda la zona: nunca se inventa. */
async function fetchStreet(id: string): Promise<string | null> {
  try {
    const res = await apiFetch(`${BASE}/${encodeURIComponent(id)}`, { method: "GET", cache: "no-store" });
    if (!res?.ok) return null;
    const j: unknown = await res.json();
    const a = isObj(j) && isObj(j.address) ? j.address : null;
    return a ? [str(a.street_line_1), str(a.street_line_2)].filter((x): x is string => x !== null).join(", ") || null : null;
  } catch {
    return null;
  }
}

/** Sigue next_cursor hasta MAX_PAGES. Sin Bearer no se llama (fail-closed). */
export async function fetchPiProperties(): Promise<Section<PiProperty[]>> {
  if (!getAuthHeaders().Authorization) return { state: "session_expired" };
  const out: PiProperty[] = [];
  let cursor: string | null = null;
  try {
    for (let i = 0; i < MAX_PAGES; i++) {
      const q = new URLSearchParams({ limit: String(PAGE_LIMIT) });
      if (cursor) q.set("cursor", cursor);
      const res = await apiFetch(`${BASE}?${q}`, { method: "GET", cache: "no-store" });
      if (!res.ok) return { state: statusToState(res.status) };
      const body: unknown = await res.json();
      if (!isObj(body) || !Array.isArray(body.items)) return { state: "error" };
      for (const p of body.items) {
        const m = mapProperty(p);
        if (m) out.push(m);
      }
      cursor = str(body.next_cursor);
      if (!cursor) break;
    }
  } catch {
    return { state: "error" };
  }
  const streets = await Promise.all(out.slice(0, MAX_DETAILS).map((p) => fetchStreet(p.id)));
  return { state: "ok", data: out.map((p, i) => ({ ...p, street: streets[i] ?? null })) };
}

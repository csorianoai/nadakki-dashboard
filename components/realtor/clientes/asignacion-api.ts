import { apiFetch } from "@/lib/api/fetch-client";

/** ROP-G4-ASIGNACION-API: asignación contacto-propiedad. El tenant y el usuario salen del token; aquí nunca viajan. */
const BASE = "/api/v1/realestate";
const HEADERS = { Accept: "application/json" };

export type PropertyOption = { id: string; label: string };
export type Assignment = { id: string; propertyId: string; assignedAt: string | null };
export type AssignResult = { ok: true } | { ok: false; status: number };

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);

/** Propiedades del tenant para elegir. Fallo → lista vacía. */
export async function fetchPropertyOptions(): Promise<PropertyOption[]> {
  try {
    const res = await apiFetch(`${BASE}/properties?limit=200`, { method: "GET", cache: "no-store", headers: HEADERS });
    if (res.status !== 200) return [];
    const body: unknown = await res.json();
    if (!isObj(body) || !Array.isArray(body.items)) return [];
    return body.items.flatMap((p) => {
      const id = isObj(p) ? str(p.id) : null;
      if (!id || !isObj(p)) return [];
      const a = isObj(p.address) ? p.address : {};
      const label = [str(a.street_line_1), str(a.city), str(a.region)].filter((x): x is string => x !== null).join(", ");
      return [{ id, label: label || id.slice(0, 8) }];
    });
  } catch {
    return [];
  }
}

/** Asignaciones activas del contacto. `null` = no se pudo leer (403, 404, red…): la pantalla lo avisa, no lo muestra como vacío. */
export async function fetchAssignments(contactId: string): Promise<Assignment[] | null> {
  try {
    const res = await apiFetch(`${BASE}/contacts/${encodeURIComponent(contactId)}/properties`, { method: "GET", cache: "no-store", headers: HEADERS });
    if (res.status !== 200) return null;
    const body: unknown = await res.json();
    if (!isObj(body) || !Array.isArray(body.items)) return null;
    return body.items.flatMap((a) => (isObj(a) && str(a.id) && str(a.property_id) ? [{ id: a.id as string, propertyId: a.property_id as string, assignedAt: str(a.assigned_at) }] : []));
  } catch {
    return null;
  }
}

export async function assignProperty(contactId: string, propertyId: string): Promise<AssignResult> {
  try {
    const res = await apiFetch(`${BASE}/contacts/${encodeURIComponent(contactId)}/properties`, {
      method: "POST", cache: "no-store", headers: { ...HEADERS, "Content-Type": "application/json" }, body: JSON.stringify({ property_id: propertyId }),
    });
    return res.status === 200 || res.status === 201 ? { ok: true } : { ok: false, status: res.status };
  } catch {
    return { ok: false, status: 0 };
  }
}

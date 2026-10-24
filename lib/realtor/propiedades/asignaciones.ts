import { apiFetch } from "@/lib/api/fetch-client";
import { BASE_OLA2 } from "./api";

/** ROP-G4-ASIGNACION-API: contacto ↔ propiedad. El tenant y el usuario salen del token en el servidor, nunca viajan. */
export type Assignment = { id: string; contactId: string; propertyId: string; assignedAt: string | null };
export type AssignResult = { ok: true } | { ok: false; reason: "validation" | "forbidden" | "notfound" | "conflict" | "other" };

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);
const HEAD = { Accept: "application/json" };

function outcome(status: number): AssignResult {
  if (status === 200 || status === 201) return { ok: true };
  if (status === 422 || status === 400) return { ok: false, reason: "validation" };
  if (status === 401 || status === 403) return { ok: false, reason: "forbidden" };
  if (status === 404) return { ok: false, reason: "notfound" };
  if (status === 409) return { ok: false, reason: "conflict" };
  return { ok: false, reason: "other" };
}

/** Asignaciones activas de la propiedad (vista desde la ficha). Cualquier fallo → lista vacía; fila inválida → se descarta. */
export async function fetchPropertyAssignments(propertyId: string): Promise<Assignment[]> {
  try {
    const res = await apiFetch(`${BASE_OLA2}/properties/${encodeURIComponent(propertyId)}/contacts`, { method: "GET", cache: "no-store", headers: HEAD });
    if (res.status !== 200) return [];
    const body: unknown = await res.json();
    if (!isObj(body) || !Array.isArray(body.items)) return [];
    return body.items.flatMap((r) => {
      if (!isObj(r)) return [];
      const id = str(r.id), contactId = str(r.contact_id), pid = str(r.property_id);
      return id && contactId && pid ? [{ id, contactId, propertyId: pid, assignedAt: str(r.assigned_at) }] : [];
    });
  } catch {
    return [];
  }
}

export async function assignContact(contactId: string, propertyId: string): Promise<AssignResult> {
  if (!contactId || !propertyId) return { ok: false, reason: "validation" };
  try {
    const res = await apiFetch(`${BASE_OLA2}/contacts/${encodeURIComponent(contactId)}/properties`, {
      method: "POST", cache: "no-store", headers: HEAD, body: JSON.stringify({ property_id: propertyId }),
    });
    return outcome(res.status);
  } catch {
    return { ok: false, reason: "other" };
  }
}

/** Retiro lógico: el servidor marca withdrawn_at; la fila deja de listarse. */
export async function withdrawAssignment(contactId: string, assignmentId: string): Promise<AssignResult> {
  if (!contactId || !assignmentId) return { ok: false, reason: "validation" };
  try {
    const res = await apiFetch(`${BASE_OLA2}/contacts/${encodeURIComponent(contactId)}/properties/${encodeURIComponent(assignmentId)}`, {
      method: "DELETE", cache: "no-store", headers: HEAD,
    });
    return outcome(res.status);
  } catch {
    return { ok: false, reason: "other" };
  }
}

import { apiFetch } from "@/lib/api/fetch-client";
import type { ClientRole, Contact } from "@/lib/realtor/clientes/types";

/** Escritura de contactos (ROP-P1-CONTACTOS-API). Tenant y propietario salen del token en el servidor: el cliente nunca los envía. */
export const CONTACTS_PATH = "/api/v1/realestate/contacts";

export type ContactKindKey = "person" | "company";
export const CONTACT_KINDS: readonly ContactKindKey[] = ["person", "company"];
/** Roles del contrato (ROLES del servicio). */
export const CONTACT_ROLES = ["prospect_tenant", "tenant", "landlord", "buyer", "seller", "guarantor"] as const;
export type ContactRoleKey = (typeof CONTACT_ROLES)[number];

const SCREEN_TO_API: Record<ClientRole, ContactRoleKey> = { comprador: "buyer", inquilino: "tenant", vendedor: "seller" };
export const apiRoleOf = (c: Contact): ContactRoleKey | "" => (c.role ? SCREEN_TO_API[c.role] : "");

export type ContactDraft = {
  kind: ContactKindKey; displayName: string; displayLabel: string; legalName: string; preferredLanguage: string; role: ContactRoleKey | "";
};
export const EMPTY_DRAFT: ContactDraft = { kind: "person", displayName: "", displayLabel: "", legalName: "", preferredLanguage: "", role: "" };

export type SaveResult =
  | { ok: true }
  | { ok: false; status: number; message: string; field: string | null };

const FIELDS = ["kind", "display_name", "display_label", "legal_name", "preferred_language", "role"];

/** Normaliza `detail` del servicio («VALIDATION_ERROR: campo») o de FastAPI (lista con `loc`) a campo + mensaje. */
export function parseProblem(status: number, body: unknown): { message: string; field: string | null } {
  const detail = (body as { detail?: unknown } | null)?.detail;
  if (typeof detail === "string") {
    const [code, rest = ""] = detail.split(/:\s*/, 2);
    const field = FIELDS.find((f) => rest.startsWith(f)) ?? null;
    return { message: rest || code, field };
  }
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as { loc?: unknown[]; msg?: unknown };
    const last = Array.isArray(first.loc) ? String(first.loc[first.loc.length - 1]) : "";
    return { message: typeof first.msg === "string" ? first.msg : `HTTP ${status}`, field: FIELDS.includes(last) ? last : null };
  }
  return { message: `HTTP ${status}`, field: null };
}

async function send(path: string, method: "POST" | "PATCH", payload: unknown): Promise<SaveResult> {
  try {
    const res = await apiFetch(path, { method, cache: "no-store", body: JSON.stringify(payload) });
    if (res.status >= 200 && res.status < 300) return { ok: true };
    let body: unknown = null;
    try { body = await res.json(); } catch { /* cuerpo ilegible: queda el estado */ }
    return { ok: false, status: res.status, ...parseProblem(res.status, body) };
  } catch {
    return { ok: false, status: 0, message: "network", field: null };
  }
}

/** Alta: POST /contacts (con rol inicial opcional). Edición: PATCH solo con lo cambiado y, si cambia el rol, POST /roles. */
export async function saveContact(draft: ContactDraft, original?: Contact): Promise<SaveResult> {
  if (!original) {
    const body: Record<string, string> = { kind: draft.kind, display_name: draft.displayName.trim(), display_label: draft.displayLabel.trim() };
    if (draft.legalName.trim()) body.legal_name = draft.legalName.trim();
    if (draft.preferredLanguage.trim()) body.preferred_language = draft.preferredLanguage.trim();
    if (draft.role) body.role = draft.role;
    return send(CONTACTS_PATH, "POST", body);
  }
  const patch: Record<string, string> = {};
  if (draft.displayLabel.trim() !== original.name) patch.display_label = draft.displayLabel.trim();
  if (draft.displayName.trim()) patch.display_name = draft.displayName.trim();
  if (draft.legalName.trim()) patch.legal_name = draft.legalName.trim();
  if (draft.preferredLanguage.trim()) patch.preferred_language = draft.preferredLanguage.trim();
  const newRole = draft.role && draft.role !== apiRoleOf(original) ? draft.role : null;
  if (Object.keys(patch).length === 0 && !newRole) return { ok: false, status: 0, message: "nochanges", field: null };
  const id = encodeURIComponent(original.id);
  if (Object.keys(patch).length > 0) {
    const r = await send(`${CONTACTS_PATH}/${id}`, "PATCH", patch);
    if (!r.ok) return r;
  }
  return newRole ? send(`${CONTACTS_PATH}/${id}/roles`, "POST", { role: newRole }) : { ok: true };
}

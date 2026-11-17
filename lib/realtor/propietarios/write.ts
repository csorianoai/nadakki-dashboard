import { apiFetch } from "@/lib/api/fetch-client";
import { OWNERS_PATH } from "./api";

const BASE = "/api/v1/realestate";

/** Valores del contrato OwnerMandateIn. El tenant NUNCA viaja: sale del token en el servidor. */
export const MANDATE_ROLES = ["landlord", "seller"] as const;
export const MANDATE_KINDS = ["exclusive", "non_exclusive", "management"] as const;

export type MandateForm = {
  contactId: string; role: string; propertyId: string; kind: string;
  sharePct: string; commissionPct: string; startsOn: string; endsOn: string;
};
export const EMPTY_MANDATE: MandateForm = { contactId: "", role: "", propertyId: "", kind: "", sharePct: "", commissionPct: "", startsOn: "", endsOn: "" };

export type Option = { id: string; label: string };
export type MandateResult = { ok: true } | { ok: false; reason: "validation" | "forbidden" | "notfound" | "conflict" | "other" };

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);

const PCT = /^\d{1,3}(\.\d{1,4})?$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Campos que fallan: obligatorios del contrato, participación en (0, 100], comisión numérica y fin ≥ inicio. */
export function missingMandateFields(f: MandateForm): string[] {
  const bad: string[] = [];
  if (!f.contactId) bad.push("contactId");
  if (!(MANDATE_ROLES as readonly string[]).includes(f.role)) bad.push("role");
  if (!f.propertyId) bad.push("propertyId");
  if (!(MANDATE_KINDS as readonly string[]).includes(f.kind)) bad.push("kind");
  const share = f.sharePct.trim();
  if (!PCT.test(share) || Number(share) <= 0 || Number(share) > 100) bad.push("sharePct");
  if (f.commissionPct.trim() && (!PCT.test(f.commissionPct.trim()) || Number(f.commissionPct) > 100)) bad.push("commissionPct");
  if (!DATE.test(f.startsOn)) bad.push("startsOn");
  if (f.endsOn && (!DATE.test(f.endsOn) || (DATE.test(f.startsOn) && f.endsOn < f.startsOn))) bad.push("endsOn");
  return bad;
}

/** Cuerpo del POST: solo lo escrito. El alta nace en borrador (el contrato lo fija por defecto). */
export function buildMandateBody(f: MandateForm): Obj {
  const body: Obj = { contact_id: f.contactId, role: f.role, property_id: f.propertyId, kind: f.kind, share_pct: f.sharePct.trim(), starts_on: f.startsOn };
  if (f.endsOn) body.ends_on = f.endsOn;
  if (f.commissionPct.trim()) body.commission_pct = f.commissionPct.trim();
  body.status = "draft";
  return body;
}

export async function createMandate(f: MandateForm): Promise<MandateResult> {
  if (missingMandateFields(f).length) return { ok: false, reason: "validation" };
  try {
    const res = await apiFetch(OWNERS_PATH, { method: "POST", cache: "no-store", headers: { Accept: "application/json" }, body: JSON.stringify(buildMandateBody(f)) });
    if (res.status === 200 || res.status === 201) return { ok: true };
    if (res.status === 422 || res.status === 400) return { ok: false, reason: "validation" };
    if (res.status === 401 || res.status === 403) return { ok: false, reason: "forbidden" };
    if (res.status === 404) return { ok: false, reason: "notfound" };
    if (res.status === 409) return { ok: false, reason: "conflict" };
  } catch { /* red caída: cae en «other» */ }
  return { ok: false, reason: "other" };
}

async function fetchItems(path: string): Promise<unknown[]> {
  try {
    const res = await apiFetch(`${BASE}${path}?limit=200`, { method: "GET", cache: "no-store", headers: { Accept: "application/json" } });
    if (res.status !== 200) return [];
    const body: unknown = await res.json();
    return isObj(body) && Array.isArray(body.items) ? body.items : [];
  } catch {
    return [];
  }
}

/** Contactos del tenant (etiqueta ya enmascarada por el servidor). Fallo → lista vacía. */
export async function fetchContactOptions(): Promise<Option[]> {
  const items = await fetchItems("/contacts");
  return items.flatMap((c) => (isObj(c) && typeof c.id === "string" && typeof c.display_label === "string" ? [{ id: c.id, label: c.display_label }] : []));
}

/** Propiedades del tenant, etiquetadas por su dirección. Fallo → lista vacía. */
export async function fetchPropertyOptions(): Promise<Option[]> {
  const items = await fetchItems("/properties");
  return items.flatMap((p) => {
    if (!isObj(p) || typeof p.id !== "string" || !isObj(p.address)) return [];
    const a = p.address;
    const label = [a.street_line_1, a.city, a.country].filter((x): x is string => typeof x === "string" && x.trim() !== "").join(", ");
    return label ? [{ id: p.id, label }] : [];
  });
}

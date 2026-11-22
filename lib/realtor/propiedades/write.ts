import { apiFetch } from "@/lib/api/fetch-client";
import { BASE_OLA2 } from "./api";

/** Tipos del contrato (property_type) tal como los pide el POST/PATCH de /properties. */
export const CONTRACT_TYPES = ["apartment", "house", "townhouse", "condo", "land", "commercial", "other"] as const;

export type PropertyForm = {
  country: string; region: string; city: string; zone: string; postalCode: string; street: string;
  jurisdiction: string; parcelId: string; propertyType: string; yearBuilt: string; ownerId: string;
  unitLabel: string; bedrooms: string; bathrooms: string;
};
export const EMPTY_FORM: PropertyForm = {
  country: "", region: "", city: "", zone: "", postalCode: "", street: "", jurisdiction: "", parcelId: "", propertyType: "",
  yearBuilt: "", ownerId: "", unitLabel: "", bedrooms: "", bathrooms: "",
};

export type OwnerOption = { id: string; label: string };
export type WriteResult = { ok: true; id: string | null } | { ok: false; reason: "validation" | "forbidden" | "notfound" | "other" };

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const txt = (v: unknown): string => (typeof v === "string" ? v : typeof v === "number" ? String(v) : "");

/** Cuerpo del POST/PATCH. Solo lo escrito; el tenant nunca viaja (sale del token en el servidor). */
export function buildBody(f: PropertyForm): Obj {
  const address: Obj = { country: f.country.trim() };
  const parts: [string, string][] = [["region", f.region], ["city", f.city], ["zone", f.zone], ["postal_code", f.postalCode], ["street_line_1", f.street]];
  for (const [k, v] of parts) if (v.trim()) address[k] = v.trim();
  const body: Obj = { address, jurisdiction: f.jurisdiction.trim(), property_type: f.propertyType };
  if (f.parcelId.trim()) body.parcel_id = f.parcelId.trim();
  if (f.yearBuilt.trim()) body.year_built = Number(f.yearBuilt);
  if (f.ownerId) body.owner_contact_id = f.ownerId;
  if (f.unitLabel.trim()) body.unit = { unit_label: f.unitLabel.trim(), bedrooms: Number(f.bedrooms || 0), bathrooms: f.bathrooms.trim() || "0" };
  return body;
}

/** Campos obligatorios del contrato y formato de los numéricos; devuelve los nombres que fallan. */
export function missingFields(f: PropertyForm): string[] {
  const bad: string[] = [];
  if (!f.country.trim()) bad.push("country");
  if (!/^[A-Z]{2}(-[A-Z0-9]{1,3}(:[a-z0-9][a-z0-9._-]{0,63}){0,2})?$/.test(f.jurisdiction.trim())) bad.push("jurisdiction");
  if (!f.propertyType) bad.push("propertyType");
  if (f.yearBuilt.trim() && !/^\d{4}$/.test(f.yearBuilt.trim())) bad.push("yearBuilt");
  if (f.unitLabel.trim() && !(/^\d{1,2}$/.test(f.bedrooms.trim() || "0") && /^\d{1,4}(\.\d{1,2})?$/.test(f.bathrooms.trim() || "0"))) bad.push("unit");
  return bad;
}

async function send(method: "POST" | "PATCH", path: string, body: Obj): Promise<WriteResult> {
  try {
    const res = await apiFetch(`${BASE_OLA2}${path}`, { method, cache: "no-store", headers: { Accept: "application/json" }, body: JSON.stringify(body) });
    if (res.status === 200 || res.status === 201) {
      const json: unknown = await res.json().catch(() => null);
      return { ok: true, id: isObj(json) && typeof json.id === "string" ? json.id : null };
    }
    if (res.status === 422 || res.status === 400) return { ok: false, reason: "validation" };
    if (res.status === 401 || res.status === 403) return { ok: false, reason: "forbidden" };
    if (res.status === 404) return { ok: false, reason: "notfound" };
  } catch { /* red caída: cae en «other» */ }
  return { ok: false, reason: "other" };
}
export const createProperty = (f: PropertyForm) => send("POST", "/properties", buildBody(f));
export const updateProperty = (id: string, f: PropertyForm) => send("PATCH", `/properties/${encodeURIComponent(id)}`, { ...buildBody(f), ...(f.ownerId ? {} : { owner_contact_id: null }) });

/** GET /properties/{id} → formulario precargado. Cualquier fallo → null (el formulario no se abre con datos inventados). */
export async function fetchPropertyForm(id: string): Promise<PropertyForm | null> {
  try {
    const res = await apiFetch(`${BASE_OLA2}/properties/${encodeURIComponent(id)}`, { method: "GET", cache: "no-store", headers: { Accept: "application/json" } });
    if (res.status !== 200) return null;
    const p: unknown = await res.json();
    if (!isObj(p) || !isObj(p.address)) return null;
    const a = p.address;
    const u = Array.isArray(p.units) && isObj(p.units[0]) ? p.units[0] : null;
    return { ...EMPTY_FORM, country: txt(a.country), region: txt(a.region), city: txt(a.city), zone: txt(a.zone), postalCode: txt(a.postal_code),
      street: txt(a.street_line_1), jurisdiction: txt(p.jurisdiction), parcelId: txt(p.parcel_id), propertyType: txt(p.property_type),
      yearBuilt: txt(p.year_built), ownerId: txt(p.owner_contact_id),
      unitLabel: u ? txt(u.unit_label) : "", bedrooms: u ? txt(u.bedrooms) : "", bathrooms: u ? txt(u.bathrooms) : "" };
  } catch {
    return null;
  }
}

/** Contactos del tenant para asignar propietario (etiqueta ya enmascarada por el servidor). Fallo → lista vacía. */
export async function fetchOwnerOptions(): Promise<OwnerOption[]> {
  try {
    const res = await apiFetch(`${BASE_OLA2}/contacts?limit=200`, { method: "GET", cache: "no-store", headers: { Accept: "application/json" } });
    if (res.status !== 200) return [];
    const body: unknown = await res.json();
    if (!isObj(body) || !Array.isArray(body.items)) return [];
    return body.items.flatMap((c) => (isObj(c) && typeof c.id === "string" && typeof c.display_label === "string" ? [{ id: c.id, label: c.display_label }] : []));
  } catch {
    return [];
  }
}

import { apiFetch, getAuthHeaders } from "@/lib/api/fetch-client";
import type { PropStatus, PropType, Property, Stage } from "./types";

/** C-RE-OLA2 1.0.0 (congelado), solo lectura. El tenant NUNCA viaja desde aquí: sale del token en el servidor. */
export const BASE_OLA2 = "/api/v1/realestate";
const PAGE_LIMIT = 200;
const MAX_PAGES = 5;

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);

const TYPE_MAP: Record<string, PropType> = {
  apartment: "condominio", condo: "condominio", house: "casa", townhouse: "townhouse", land: "terreno", commercial: "comercial", other: "otro",
};
const STATUS_MAP: Record<string, PropStatus> = {
  draft: "activa", active: "activa", pending: "en_contrato", sold: "vendida", leased: "vendida", withdrawn: "retirada", expired: "retirada",
};
const STAGE_MAP: Record<string, Stage> = {
  captar: "acquire", cma: "cma", acuerdo: "agreement", preparar_publicar: "prepare_publish", marketing_visitas: "marketing_showings",
  ofertas: "offers", contrato_contingencias: "contract_contingencies", cierre: "closing",
};

/** Dirección del contrato recortada a ciudad y región (las listas no traen calle). */
function addressLabel(a: unknown): string | null {
  if (!isObj(a)) return null;
  const parts = [str(a.city), str(a.region)].filter((x): x is string => x !== null);
  return parts.length ? parts.join(", ") : null;
}

/** Une PropertySummary y ListingSummary: una fila por listing. Fila inválida → se descarta (fail-closed), nunca se inventa. */
export function mapProperties(properties: readonly unknown[], listings: readonly unknown[]): Property[] {
  const byId = new Map<string, Obj>();
  for (const p of properties) if (isObj(p) && str(p.id)) byId.set(p.id as string, p);
  const out: Property[] = [];
  for (const l of listings) {
    if (!isObj(l)) continue;
    const id = str(l.id);
    const prop = byId.get(str(l.property_id) ?? "");
    const type = prop ? TYPE_MAP[String(prop.property_type)] : undefined;
    const status = STATUS_MAP[String(l.status)];
    const address = prop ? addressLabel(prop.address) : null;
    const price = isObj(l.list_price) ? l.list_price : null;
    const amount = price ? Number(price.amount) : NaN;
    const currency = price ? str(price.currency) : null;
    if (!id || !type || !status || !address || !currency || !Number.isFinite(amount)) continue;
    out.push({ id, address, type, status, stage: STAGE_MAP[String(l.active_stage)] ?? null, price: { amount, currency }, units: [] });
  }
  return out;
}

/** Sigue next_cursor hasta MAX_PAGES. Cualquier estado ≠ 200 (404, 503…), cuerpo ilegible o fallo de red → lista vacía. */
async function fetchAll(path: string): Promise<unknown[]> {
  const items: unknown[] = [];
  let cursor: string | null = null;
  try {
    for (let i = 0; i < MAX_PAGES; i++) {
      const q = new URLSearchParams({ limit: String(PAGE_LIMIT) });
      if (cursor) q.set("cursor", cursor);
      const res = await apiFetch(`${BASE_OLA2}${path}?${q}`, { method: "GET", cache: "no-store", headers: { Accept: "application/json", ...getAuthHeaders() } });
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
  return items;
}

export async function fetchProperties(): Promise<Property[]> {
  const [properties, listings] = await Promise.all([fetchAll("/properties"), fetchAll("/listings")]);
  // mapProperties no cambia (contrato probado); el id de propiedad, que la edición necesita, se añade aquí desde el listing.
  const propertyOf = new Map<string, string>();
  for (const l of listings) if (isObj(l) && str(l.id) && str(l.property_id)) propertyOf.set(l.id as string, l.property_id as string);
  return mapProperties(properties, listings).map((p) => ({ ...p, propertyId: propertyOf.get(p.id) }));
}

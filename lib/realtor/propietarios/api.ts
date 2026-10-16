import { apiFetch, getAuthHeaders } from "@/lib/api/fetch-client";
import type { AgreementStatus, OwnerRole, OwnerRow } from "./types";

/** C-RE-OLA3 1.0.0 (congelado, C-RE-PROPIETARIOS), solo lectura. El tenant NUNCA viaja desde aquí: sale del token en el servidor. */
export const OWNERS_PATH = "/api/v1/realestate/owners";
const PAGE_LIMIT = 200;
const MAX_PAGES = 5;

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);

/** OwnerRoleKey del contrato → rol de la pantalla. */
const ROLE_MAP: Record<string, OwnerRole> = { landlord: "arrendador", seller: "vendedor" };

/**
 * OwnerSummary → filas. Una fila por (propietario, rol vigente). El contrato no trae propiedad, precio, etapa ni seguimiento:
 * quedan null (nunca se inventan). Acuerdo: mandates_active > 0 → vigente; si no, null (puede ser borrador o ninguno).
 * Fila inválida → se descarta (fail-closed).
 */
export function mapOwners(items: readonly unknown[]): OwnerRow[] {
  const out: OwnerRow[] = [];
  for (const it of items) {
    if (!isObj(it) || !isObj(it.contact) || !Array.isArray(it.owner_roles)) continue;
    const id = str(it.contact.id);
    const name = str(it.contact.display_label);
    if (!id || !name) continue;
    const count = (v: unknown): number | null => (typeof v === "number" && Number.isInteger(v) && v >= 0 ? v : null);
    const mandates = count(it.mandates_active);
    const propertiesCount = count(it.properties_count);
    const agreement: AgreementStatus | null = mandates !== null && mandates > 0 ? "vigente" : null;
    const roles = new Set<OwnerRole>();
    for (const r of it.owner_roles) if (typeof r === "string" && ROLE_MAP[r]) roles.add(ROLE_MAP[r]);
    for (const role of roles) {
      out.push({ id: `${id}:${role}`, name, role, property: null, propertiesCount, priceUsd: null, agreement, stage: null, followUp: null });
    }
  }
  return out;
}

/** Sigue next_cursor hasta MAX_PAGES. Cualquier estado ≠ 200 (404, 503…), cuerpo ilegible o fallo de red → lista vacía. */
export async function fetchOwners(): Promise<OwnerRow[]> {
  const items: unknown[] = [];
  let cursor: string | null = null;
  try {
    for (let i = 0; i < MAX_PAGES; i++) {
      const q = new URLSearchParams({ limit: String(PAGE_LIMIT) });
      if (cursor) q.set("cursor", cursor);
      const res = await apiFetch(`${OWNERS_PATH}?${q}`, { method: "GET", cache: "no-store", headers: { Accept: "application/json", ...getAuthHeaders() } });
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
  return mapOwners(items);
}

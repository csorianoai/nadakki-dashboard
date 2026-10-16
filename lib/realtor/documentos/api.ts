import { apiFetch, getAuthHeaders } from "@/lib/api/fetch-client";
import type { ApiDocStatus, OperationDoc } from "./types";

/** C-RE-OLA3 1.0.0 (congelado), C-RE-DOCUMENTOS, solo lectura de metadatos. El tenant NUNCA viaja desde aquí: sale del token en el servidor. */
export const BASE_OLA3 = "/api/v1/realestate";
const PAGE_LIMIT = 200;
const MAX_PAGES = 5;

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);

const STATUSES: readonly ApiDocStatus[] = ["pending_upload", "active", "archived"];

const DOC_TYPE: Record<string, { es: string; en: string }> = {
  listing_agreement: { es: "Acuerdo de listado", en: "Listing agreement" },
  owner_mandate: { es: "Mandato del propietario", en: "Owner mandate" },
  sale_contract: { es: "Contrato de venta", en: "Sale contract" },
  lease_agreement: { es: "Contrato de arrendamiento", en: "Lease agreement" },
  disclosure: { es: "Divulgación", en: "Disclosure" },
  inspection_report: { es: "Informe de inspección", en: "Inspection report" },
  appraisal: { es: "Tasación", en: "Appraisal" },
  title_deed: { es: "Escritura", en: "Title deed" },
  receipt: { es: "Recibo", en: "Receipt" },
  other: { es: "Otro", en: "Other" },
};
const SUBJECT: Record<string, { es: string; en: string }> = {
  contact: { es: "Contacto", en: "Contact" },
  property: { es: "Propiedad", en: "Property" },
  listing: { es: "Listado", en: "Listing" },
  operation: { es: "Operación", en: "Transaction" },
  mandate: { es: "Mandato", en: "Mandate" },
  calendar_event: { es: "Evento", en: "Event" },
};

/** DocumentView → fila de la pantalla. Fila inválida → se descarta (fail-closed), nunca se inventa. */
export function mapDocuments(items: readonly unknown[]): OperationDoc[] {
  const out: OperationDoc[] = [];
  for (const d of items) {
    if (!isObj(d)) continue;
    const id = str(d.id);
    const name = str(d.title);
    const type = DOC_TYPE[String(d.doc_type)];
    const subject = SUBJECT[String(d.subject_type)];
    const status = STATUSES.find((s) => s === d.status);
    if (!id || !name || !type || !subject || !status) continue;
    out.push({ id, name, operation: { es: `${type.es} · ${subject.es}`, en: `${type.en} · ${subject.en}` }, status });
  }
  return out;
}

/** Sigue next_cursor hasta MAX_PAGES. Cualquier estado ≠ 200 (404, 503…), cuerpo ilegible o fallo de red → lista vacía. */
export async function fetchDocuments(): Promise<OperationDoc[]> {
  const items: unknown[] = [];
  let cursor: string | null = null;
  try {
    for (let i = 0; i < MAX_PAGES; i++) {
      const q = new URLSearchParams({ limit: String(PAGE_LIMIT) });
      if (cursor) q.set("cursor", cursor);
      const res = await apiFetch(`${BASE_OLA3}/documents?${q}`, { method: "GET", cache: "no-store", headers: { Accept: "application/json", ...getAuthHeaders() } });
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
  return mapDocuments(items);
}

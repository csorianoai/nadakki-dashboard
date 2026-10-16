import { apiFetch, getAuthHeaders } from "@/lib/api/fetch-client";
import type { OpKind, Operation } from "./types";

/** C-RE-OLA3 1.0.0 (congelado, C-RE-OPERACIONES), solo lectura. El tenant NUNCA viaja desde aquí: sale del token en el servidor. */
export const OPERATIONS_PATH = "/api/v1/realestate/operations";
const PAGE_LIMIT = 200;
const MAX_PAGES = 5;

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);

const KIND_MAP: Record<string, OpKind> = { rental: "alquiler", sale: "venta" };
const STATUS_LABEL: Record<string, { es: string; en: string }> = {
  draft: { es: "borrador", en: "draft" },
  in_progress: { es: "en curso", en: "in progress" },
  on_hold: { es: "en pausa", en: "on hold" },
  closed_won: { es: "cerrada ganada", en: "closed won" },
  closed_lost: { es: "cerrada perdida", en: "closed lost" },
  cancelled: { es: "cancelada", en: "cancelled" },
};

/**
 * Operation del contrato → fila de la pantalla. La lista no trae etapa (los hitos son por plantilla, no las 7 etapas de la
 * pantalla): `stage` queda null y la fila se muestra aparte, sin inventar etapa. Fila inválida → se descarta (fail-closed).
 */
export function mapOperations(items: readonly unknown[]): Operation[] {
  const out: Operation[] = [];
  for (const o of items) {
    if (!isObj(o)) continue;
    const id = str(o.id);
    const kind = KIND_MAP[String(o.kind)];
    const status = STATUS_LABEL[String(o.status)];
    if (!id || !kind || !status) continue;
    const price = isObj(o.agreed_price) ? o.agreed_price : null;
    const amount = price ? Number(price.amount) : NaN;
    const currency = price ? str(price.currency) : null;
    const money = currency && Number.isFinite(amount) ? ` · ${currency} ${amount.toLocaleString("en-US")}` : "";
    out.push({
      id,
      code: `${kind === "alquiler" ? "Alquiler" : "Venta"} ${id.slice(0, 8)}`,
      kind,
      stage: null,
      summary: { es: `Estado: ${status.es}${money}`, en: `Status: ${status.en}${money}` },
    });
  }
  return out;
}

/** Sigue next_cursor hasta MAX_PAGES. Cualquier estado ≠ 200 (404, 503…), cuerpo ilegible o fallo de red → lista vacía. */
export async function fetchOperations(): Promise<Operation[]> {
  const items: unknown[] = [];
  let cursor: string | null = null;
  try {
    for (let i = 0; i < MAX_PAGES; i++) {
      const q = new URLSearchParams({ limit: String(PAGE_LIMIT) });
      if (cursor) q.set("cursor", cursor);
      const res = await apiFetch(`${OPERATIONS_PATH}?${q}`, { method: "GET", cache: "no-store", headers: { Accept: "application/json", ...getAuthHeaders() } });
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
  return mapOperations(items);
}

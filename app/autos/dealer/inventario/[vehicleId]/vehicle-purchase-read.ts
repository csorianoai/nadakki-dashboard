/**
 * Lectura de la compra de un vehiculo (F4D-4): GET /api/v1/autos/vehicles/{id}/purchase y
 * (el contacto del vendedor llega en la PARTE 2/2). El tenant sale SOLO del token (sin X-Tenant-ID).
 *
 * Nada se inventa: lo que la respuesta no trae queda en null y la pantalla no lo pinta.
 * `engine_number` solo existe si el backend lo entrega (autos.engine_number.view).
 */
import { accessApiErrorFromHttp } from "@/lib/access/client";
import { apiFetch } from "@/lib/api/fetch-client";

export type PagoCompra = {
  method: string;
  amount: string;
  check_number: string | null;
  check_bank: string | null;
  check_cash_date: string | null;
  detail: string | null;
};

export type CambioCompra = { rate: string; source: string | null; detail: string | null; as_of: string | null };

export type CompraLeida = {
  cost: string;
  currency: string | null;
  mode: string | null;
  acquired_on: string | null;
  country_code: string | null;
  supplier_reference: string | null;
  seller_contact_id: string | null;
  fx: CambioCompra | null;
  payments: PagoCompra[];
  engine_number: string | null;
};

/** `null` = el vehiculo no tiene compra registrada (anterior a F4C). */
export type CompraResultado = CompraLeida | null;

type Rec = Record<string, unknown>;
const rec = (v: unknown): Rec | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Rec) : null);
const txt = (v: unknown): string | null => {
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return typeof v === "string" && v.trim() ? v.trim() : null;
};

export const vehiclePurchaseUrl = (vehicleId: string) => `/api/v1/autos/vehicles/${encodeURIComponent(vehicleId)}/purchase`;

export function parseCompra(body: unknown): CompraResultado {
  const r = rec(body);
  if (!r) return null;
  const acq = rec(r.acquisition) ?? {};
  const cost = txt(r.cost) ?? txt(r.amount) ?? txt(r.total_cost);
  if (cost === null) return null;
  const fxRec = rec(acq.fx) ?? rec(r.fx);
  const rate = fxRec ? txt(fxRec.rate) : null;
  const payments = (Array.isArray(r.payments) ? r.payments : r.pagos ? (r.pagos as unknown[]) : [])
    .map((p): PagoCompra | null => {
      const x = rec(p);
      const amount = x ? txt(x.amount) : null;
      if (!x || amount === null) return null;
      return {
        method: txt(x.method) ?? "",
        amount,
        check_number: txt(x.check_number),
        check_bank: txt(x.check_bank),
        check_cash_date: txt(x.check_cash_date),
        detail: txt(x.detail),
      };
    })
    .filter((p): p is PagoCompra => p !== null);
  return {
    cost,
    currency: txt(r.currency),
    mode: txt(acq.mode) ?? txt(acq.acquisition_mode_code),
    acquired_on: txt(acq.acquired_on),
    country_code: txt(acq.country_code),
    supplier_reference: txt(acq.supplier_reference),
    seller_contact_id: txt(acq.seller_contact_id),
    fx: fxRec && rate ? { rate, source: txt(fxRec.source), detail: txt(fxRec.detail), as_of: txt(fxRec.as_of) } : null,
    payments,
    engine_number: txt(r.engine_number) ?? txt(acq.engine_number),
  };
}

async function get(path: string): Promise<{ status: number; body: unknown }> {
  const response = await apiFetch(path, { method: "GET", headers: { Accept: "application/json" } });
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (!response.ok && response.status !== 404) throw accessApiErrorFromHttp(response.status, body, path);
  return { status: response.status, body };
}

/** 403 y otros errores se lanzan como AccessApiError; 404 = sin compra registrada. */
export async function fetchCompra(vehicleId: string): Promise<CompraResultado> {
  const { status, body } = await get(vehiclePurchaseUrl(vehicleId));
  return status === 404 ? null : parseCompra(body);
}

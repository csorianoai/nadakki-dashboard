/** F4D-4: GET /api/v1/autos/vehicles/{id}/purchase; tenant solo del token (sin X-Tenant-ID). Lo que no llega queda en null. */
import { accessApiErrorFromHttp } from "@/lib/access/client";
import { apiFetch } from "@/lib/api/fetch-client";

export type PagoCompra = {
  method: string;
  amount: string;
  check_number: string | null;
  check_bank: string | null;
  check_cash_date: string | null;
  detail: string | null;
  voided: boolean;
};

export type CambioCompra = { rate: string; source: string | null; detail: string | null; as_of: string | null };

export type CompraLeida = {
  cost: string;
  currency: string | null;
  /** Total pagado segun el backend (excluye pagos anulados). */
  paid_total: string | null;
  mode: string | null;
  acquired_on: string | null;
  country_code: string | null;
  supplier_reference: string | null;
  seller_contact_id: string | null;
  fx: CambioCompra | null;
  payments: PagoCompra[];
  engine_number: string | null;
};

/** `null` = sin compra registrada (anterior a F4C). */
export type CompraResultado = CompraLeida | null;

type Rec = Record<string, unknown>;
const rec = (v: unknown): Rec | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Rec) : null);
const txt = (v: unknown): string | null =>
  typeof v === "number" && Number.isFinite(v) ? String(v) : typeof v === "string" && v.trim() ? v.trim() : null;

export const vehiclePurchaseUrl = (vehicleId: string) => `/api/v1/autos/vehicles/${encodeURIComponent(vehicleId)}/purchase`;

export function parseCompra(body: unknown): CompraResultado {
  const r = rec(body);
  if (!r) return null;
  const acq = rec(r.acquisition) ?? {};
  // leer(): cost = {currency, amount, paid_total} o null (sin compra).
  const costRec = rec(r.cost);
  const cost = costRec ? txt(costRec.amount) : txt(r.cost);
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
        voided: x.voided === true,
      };
    })
    .filter((p): p is PagoCompra => p !== null);
  return {
    cost,
    currency: (costRec ? txt(costRec.currency) : null) ?? txt(r.currency),
    paid_total: costRec ? txt(costRec.paid_total) : null,
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

/** 403 y otros errores se lanzan como AccessApiError; 404 = sin compra registrada. */
export async function fetchCompra(vehicleId: string): Promise<CompraResultado> {
  const path = vehiclePurchaseUrl(vehicleId);
  const response = await apiFetch(path, { method: "GET", headers: { Accept: "application/json" } });
  if (response.status === 404) return null;
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) throw accessApiErrorFromHttp(response.status, body, path);
  return parseCompra(body);
}

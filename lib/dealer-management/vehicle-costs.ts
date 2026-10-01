/**
 * Costos por vehiculo (DASH-VEHICLE-COSTS-01). Contrato medido contra el
 * OpenAPI vivo de api.nadakki.com, no contra el snapshot del repo.
 *
 * Lo que el backend expone hoy, con tag `autos-portal-economics`:
 *   POST /api/v1/autos/vehicles/{id}/costs        · CostIn
 *   GET  /api/v1/autos/vehicles/{id}/costs/total  · total por moneda
 *   GET  /api/v1/autos/vehicles/{id}/margin       · solo con venta
 *
 * Lo que NO expone, y por eso esta pantalla no lo finge:
 *   - No hay GET de la LISTA de costos. Solo el total por moneda. Una tabla de
 *     asientos aqui seria inventada, asi que se dice que falta el endpoint.
 *   - `CostIn` no tiene proveedor, ni numero de factura, ni marca de gasto de
 *     apertura. Pedirlos y mandarlos los perderia en silencio; pedirlos y NO
 *     mandarlos seria peor: el usuario creeria que quedo registrado. Se pintan
 *     deshabilitados con el motivo.
 *
 * La moneda sale de la del tenant (`localeDeTenant`, #517) y nunca se escribe a
 * mano. Sin moneda del tenant no hay alta: #517 falla cerrado a proposito.
 */

import { accessApiErrorFromHttp } from "@/lib/access/client";
import { apiFetch } from "@/lib/api/fetch-client";

/**
 * No hay clave 097 propia de "costos de vehiculo". La que firma dinero en el
 * catalogo es la del mayor contable, la misma que ya cierra /contable en
 * `dealer-nav.ts`. Pedir ademas el inventario evita pintar el panel a quien no
 * puede ni ver la unidad. El 403 del backend sigue siendo la autoridad; si
 * aparece una clave dedicada, se cambia esta constante y nada mas.
 */
export const COSTS_CAPABILITY = "accounting.ledger.entries";
export const COSTS_VEHICLE_CAPABILITY = "autos.inventory.list";
export const COSTS_CAPABILITY_KEYS = [COSTS_VEHICLE_CAPABILITY, COSTS_CAPABILITY];

export const COSTS_LIST_MISSING_ENDPOINT = "GET /api/v1/autos/vehicles/{vehicle_id}/costs";

/** Sin enum en el contrato: `cost_type` es texto libre de 40. Catalogo del panel. */
export const COST_TYPES = [
  { value: "REPARACION", label: "Reparación" },
  { value: "TRANSPORTE", label: "Transporte" },
  { value: "PATENTAMIENTO", label: "Patentamiento" },
  { value: "COMISION", label: "Comisión" },
  { value: "LIMPIEZA", label: "Limpieza y preparación" },
  { value: "OTRO", label: "Otro" },
] as const;

export const COST_TYPE_REPARACION = "REPARACION";

/** Campos que la operacion pide y `CostIn` no acepta todavia. */
export const COST_PENDING_FIELDS = [
  { name: "supplier", label: "Proveedor" },
  { name: "invoice_number", label: "N.º de factura" },
  { name: "opening_expense", label: "Gasto de apertura" },
] as const;

export type CostForm = {
  cost_type: string;
  amount: string;
  incurred_at: string;
};

export const COST_FORM_EMPTY: CostForm = { cost_type: COST_TYPE_REPARACION, amount: "", incurred_at: "" };

export type CostFormErrors = Partial<Record<keyof CostForm | "currency", string>>;

/**
 * `amount` viaja como texto: el patron del contrato acepta string y asi no se
 * pierde el decimal por un redondeo de float.
 */
export function validateCostForm(form: CostForm, currency: string | null): CostFormErrors {
  const errors: CostFormErrors = {};
  if (!currency) errors.currency = "Falta la moneda funcional del tenant. No se puede registrar el costo.";

  const type = form.cost_type.trim();
  if (!type) errors.cost_type = "Elegí un tipo de costo.";
  else if (type.length > 40) errors.cost_type = "Máximo 40 caracteres.";

  const amount = form.amount.trim();
  if (!amount) errors.amount = "El monto es obligatorio.";
  else if (!/^\d+(\.\d{1,2})?$/.test(amount) || Number(amount) <= 0) {
    errors.amount = "El monto es un número mayor que cero, con hasta dos decimales.";
  }

  if (!form.incurred_at.trim()) errors.incurred_at = "La fecha es obligatoria.";
  return errors;
}

/** `date-time` del contrato a partir del `type="date"` del formulario. */
export function incurredAtIso(fecha: string): string {
  const trimmed = fecha.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? `${trimmed}T00:00:00Z` : trimmed;
}

export function costInPayload(form: CostForm, currency: string): Record<string, unknown> {
  return {
    cost_type: form.cost_type.trim(),
    amount: form.amount.trim(),
    currency,
    incurred_at: incurredAtIso(form.incurred_at),
  };
}

export type CostTotalRow = { currency: string; total: number };

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function rows(body: unknown): unknown[] {
  if (Array.isArray(body)) return body;
  const rec = record(body);
  if (!rec) return [];
  for (const key of ["totals", "items", "rows", "results"]) {
    if (Array.isArray(rec[key])) return rec[key] as unknown[];
  }
  return [];
}

function amountOf(rec: Record<string, unknown>): number | null {
  for (const key of ["total", "total_amount", "amount", "sum"]) {
    const value = rec[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  }
  return null;
}

/**
 * "Sin asientos, lista vacia" lo dice el propio contrato: una lista vacia es un
 * cero real, no un fallo. Una fila sin moneda o sin importe se descarta en vez
 * de rellenarse con un cero inventado.
 */
export function parseCostTotals(body: unknown): CostTotalRow[] {
  const parsed: CostTotalRow[] = [];
  for (const value of rows(body)) {
    const rec = record(value);
    if (!rec) continue;
    const currency = typeof rec.currency === "string" ? rec.currency.trim().toUpperCase() : "";
    const total = amountOf(rec);
    if (currency.length !== 3 || total === null) continue;
    parsed.push({ currency, total });
  }
  return parsed;
}

/** Fila de la moneda funcional del tenant. Nunca se suman monedas distintas. */
export function totalEnMoneda(totals: CostTotalRow[], currency: string | null): CostTotalRow | null {
  if (!currency) return null;
  return totals.find((row) => row.currency === currency.toUpperCase()) ?? null;
}

export function vehicleCostTotalPath(vehicleId: string): string {
  return `/api/v1/autos/vehicles/${encodeURIComponent(vehicleId)}/costs/total`;
}

export async function fetchVehicleCostTotals(vehicleId: string, tenantId: string): Promise<CostTotalRow[]> {
  const path = vehicleCostTotalPath(vehicleId);
  const response = await apiFetch(path, {
    headers: { Accept: "application/json", "X-Tenant-ID": tenantId },
  });
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (!response.ok) throw accessApiErrorFromHttp(response.status, body, path);
  return parseCostTotals(body);
}

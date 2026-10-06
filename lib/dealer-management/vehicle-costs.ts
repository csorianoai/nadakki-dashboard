/**
 * Costos por vehiculo (DASH-VEHICLE-COSTS-01). Contrato medido sobre
 * `origin/main` del backend, no sobre el snapshot del repo.
 *
 *   POST /api/v1/autos/vehicles/{id}/costs            CostIn
 *   POST /api/v1/autos/vehicles/{id}/repair-invoices   RepairInvoiceIn
 *   GET  /api/v1/autos/vehicles/{id}/costs/total       [{currency,total_cost}]
 *   POST /api/v1/autos/vehicles/{id}/documents         multipart file+doc_type -> {id}
 *
 * `cost_type` NO es texto libre: lo cierra un CHECK en PostgreSQL. Los valores
 * son codigos en ingles (`purchase`, `repair`, ...) y la etiqueta en espanol es
 * solo de UI. Enviar "REPARACION" lo rechaza la base.
 *
 * Y `repair` no se puede registrar por /costs: un segundo CHECK exige
 * `supplier_name` y `invoice_number`, que `CostIn` no transporta. La via de
 * reparacion es /repair-invoices, que ademas exige `document_id` de un
 * documento ya subido al tenant.
 *
 * services/autos_portal/vehicle_economics_router.py:43 (CostIn), :63
 * (RepairInvoiceIn), :214 (ruta de reparacion), :255 (total).
 * migrations/proposals/DMS-02R-REPAIR_external.request.yaml:36-37 (los dos CHECK).
 *
 * No hay GET de la lista de costos: solo el total por moneda. La marca de
 * saldo inicial es `is_opening` (PEV-COST-RECORDED). Objetivo contable: asiento
 * contra 3020 (Saldos iniciales) en vez de 2010 (Proveedores). OJO: hoy el
 * backend (nadakki-ai-suite, `CostIn` en vehicle_economics_router.py) NO declara
 * `is_opening` y lo ignora sin error, asi que el asiento sigue yendo a 2010.
 * Solo viaja si esta tildada y solo por /costs; una reparacion es siempre una
 * compra nueva. No exponer la casilla en la UI hasta que el backend lo acepte.
 *
 * La moneda sale del tenant (`localeDeTenant`, #517) y nunca se escribe a mano.
 */

import { AccessApiError, accessApiErrorFromHttp } from "@/lib/access/client";
import { apiFetch } from "@/lib/api/fetch-client";

/**
 * No hay clave 097 propia de "costos de vehiculo". La que firma dinero en el
 * catalogo es la del mayor contable, la misma que ya cierra /contable. Pedir
 * ademas el inventario evita pintar el panel a quien no ve la unidad. El 403 del
 * backend sigue siendo la autoridad.
 */
export const COSTS_CAPABILITY = "accounting.ledger.entries";
export const COSTS_VEHICLE_CAPABILITY = "autos.inventory.list";
export const COSTS_CAPABILITY_KEYS = [COSTS_VEHICLE_CAPABILITY, COSTS_CAPABILITY];

export const COSTS_LIST_MISSING_ENDPOINT = "GET /api/v1/autos/vehicles/{vehicle_id}/costs";

/** Valor = codigo del CHECK. Etiqueta = UI. GESTORIA/`registration` no existe aun. */
export const COST_TYPES = [
  { value: "purchase", label: "Compra" },
  { value: "repair", label: "Reparación" },
  { value: "reconditioning", label: "Reacondicionamiento" },
  { value: "transport", label: "Traslado" },
  { value: "tax", label: "Impuesto" },
  { value: "commission", label: "Comisión" },
  { value: "other", label: "Otro" },
] as const;

/** Enumeracion exacta del CHECK de `vehicle_cost_entries.cost_type`. */
export const COST_TYPE_CHECK = new Set([
  "purchase",
  "reconditioning",
  "transport",
  "tax",
  "commission",
  "other",
  "repair",
]);

export const COST_TYPE_REPAIR = "repair";

/** Obsoleto: la UI deja de usarlo en la PARTE 2/3 y se borra en la 3/3. */
export const COST_PENDING_FIELDS = [{ name: "is_opening", label: "Gasto de apertura" }] as const;

export type CostForm = {
  cost_type: string;
  amount: string;
  incurred_at: string;
  supplier_name: string;
  invoice_number: string;
  document_id: string;
  is_opening: boolean;
};

export const COST_FORM_EMPTY: CostForm = {
  cost_type: "purchase",
  amount: "",
  incurred_at: "",
  supplier_name: "",
  invoice_number: "",
  document_id: "",
  is_opening: false,
};

export type CostFormErrors = Partial<Record<keyof CostForm | "currency", string>>;

export function esReparacion(costType: string): boolean {
  return costType.trim() === COST_TYPE_REPAIR;
}

/** `amount` viaja como texto: el patron del contrato lo acepta y no pierde el decimal. */
export function validateCostForm(form: CostForm, currency: string | null): CostFormErrors {
  const errors: CostFormErrors = {};
  if (!currency) errors.currency = "Falta configurar la moneda de tu concesionario. No se puede registrar el costo.";

  const type = form.cost_type.trim();
  if (!COST_TYPE_CHECK.has(type)) errors.cost_type = "Elegí un tipo de costo del catálogo.";

  const amount = montoNormalizado(form.amount);
  if (!amount) errors.amount = "El monto es obligatorio.";
  else if (!/^\d+(\.\d{1,2})?$/.test(amount) || Number(amount) <= 0) {
    errors.amount = "El monto es un número mayor que cero, con hasta dos decimales (por ejemplo 1500,50).";
  }

  if (!form.incurred_at.trim()) errors.incurred_at = "La fecha es obligatoria.";

  if (esReparacion(type)) {
    if (!form.supplier_name.trim()) errors.supplier_name = "El proveedor es obligatorio en una reparación.";
    if (!form.invoice_number.trim()) errors.invoice_number = "El n.º de factura es obligatorio en una reparación.";
    if (!form.document_id.trim()) {
      errors.document_id = "Subí la factura de la reparación.";
    }
  }
  return errors;
}

/** "1500,50" -> "1500.50": el dealer escribe con coma decimal. */
export function montoNormalizado(monto: string): string {
  const limpio = monto.trim();
  return /^\d+,\d{1,2}$/.test(limpio) ? limpio.replace(",", ".") : limpio;
}

/** `date-time` del contrato a partir del `type="date"` del formulario. */
export function incurredAtIso(fecha: string): string {
  const trimmed = fecha.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? `${trimmed}T00:00:00Z` : trimmed;
}

/**
 * Cuerpo de `CostIn`. Rechaza `repair`. `is_opening` solo viaja si esta tildada;
 * el backend actual lo ignora (no cambia la cuenta contra 2010 todavia).
 */
export function costInPayload(form: CostForm, currency: string): Record<string, unknown> {
  const cost_type = form.cost_type.trim();
  if (esReparacion(cost_type)) {
    throw new Error("REPAIR_REQUIERE_REPAIR_INVOICES");
  }
  return {
    cost_type,
    amount: montoNormalizado(form.amount),
    currency,
    incurred_at: incurredAtIso(form.incurred_at),
    ...(form.is_opening ? { is_opening: true } : {}),
  };
}

/** Cuerpo de `RepairInvoiceIn`. Los tres identificadores son obligatorios. */
export function repairInvoicePayload(form: CostForm, currency: string): Record<string, unknown> {
  return {
    amount: montoNormalizado(form.amount),
    currency,
    incurred_at: incurredAtIso(form.incurred_at),
    supplier_name: form.supplier_name.trim(),
    invoice_number: form.invoice_number.trim(),
    document_id: form.document_id.trim(),
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

/** El contrato devuelve `total_cost`, como texto. Se aceptan alias por tolerancia. */
function amountOf(rec: Record<string, unknown>): number | null {
  for (const key of ["total_cost", "total", "total_amount", "amount"]) {
    const value = rec[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  }
  return null;
}

/**
 * "Sin asientos, lista vacia" lo dice el contrato: una lista vacia es un cero
 * real, no un fallo. Una fila sin moneda o sin importe se descarta en vez de
 * rellenarse con un cero inventado.
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

function vehiclePath(vehicleId: string, suffix: string): string {
  return `/api/v1/autos/vehicles/${encodeURIComponent(vehicleId)}/${suffix}`;
}

export function vehicleCostTotalPath(vehicleId: string): string {
  return vehiclePath(vehicleId, "costs/total");
}

async function readJson(response: Response, path: string): Promise<unknown> {
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (!response.ok) throw accessApiErrorFromHttp(response.status, body, path);
  return body;
}

export async function fetchVehicleCostTotals(vehicleId: string, tenantId: string): Promise<CostTotalRow[]> {
  const path = vehicleCostTotalPath(vehicleId);
  const response = await apiFetch(path, {
    headers: { Accept: "application/json", "X-Tenant-ID": tenantId },
  });
  return parseCostTotals(await readJson(response, path));
}

/** Enruta por tipo: `repair` a /repair-invoices, el resto a /costs. */
export async function postCost(
  vehicleId: string,
  tenantId: string,
  form: CostForm,
  currency: string,
): Promise<unknown> {
  const reparacion = esReparacion(form.cost_type);
  const path = vehiclePath(vehicleId, reparacion ? "repair-invoices" : "costs");
  const body = reparacion ? repairInvoicePayload(form, currency) : costInPayload(form, currency);
  const response = await apiFetch(path, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Tenant-ID": tenantId,
    },
    body: JSON.stringify(body),
  });
  return readJson(response, path);
}

/** Tope del backend para un documento del vehiculo (`MAX_BYTES`, 10 MB). */
export const FACTURA_MAX_BYTES = 10 * 1024 * 1024;

/**
 * Sube la factura de la reparacion y devuelve su `id`, que es el `document_id`
 * que pide `/repair-invoices`. Multipart con `file` y `doc_type`; sin
 * Content-Type para que el navegador ponga el boundary.
 */
export async function uploadRepairInvoice(vehicleId: string, tenantId: string, file: File): Promise<string> {
  const path = vehiclePath(vehicleId, "documents");
  const body = new FormData();
  body.append("file", file);
  body.append("doc_type", "repair_invoice");
  const response = await apiFetch(path, {
    method: "POST",
    headers: { Accept: "application/json", "X-Tenant-ID": tenantId },
    body,
  });
  const id = record(await readJson(response, path))?.id;
  if (typeof id !== "string" || !id.trim()) throw accessApiErrorFromHttp(502, { reason_code: "DOCUMENT_ID_MISSING" }, path);
  return id.trim();
}

/** Un error de la API, dicho para el dealer. El codigo queda aparte, para soporte. */
export function mensajeDeErrorCosto(error: unknown): string {
  const status = error instanceof AccessApiError ? error.status : 0;
  if (status === 413) return "El archivo pesa más de 10 MB. Subí una versión más liviana.";
  if (status === 401) return "Tu sesión venció. Volvé a iniciar sesión e intentá de nuevo.";
  if (status === 403) return "Tu usuario no tiene permiso para registrar costos de este vehículo.";
  if (status === 404) return "No encontramos este vehículo. Recargá la página.";
  if (status === 409 || status === 422) return "El sistema rechazó los datos. Revisá monto, fecha y factura.";
  if (status >= 500) return "El servicio no respondió. Probá de nuevo en unos minutos.";
  return "No hubo respuesta del servidor. Revisá tu conexión e intentá de nuevo.";
}

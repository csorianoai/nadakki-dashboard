/**
 * Venta de un vehiculo (D6). La UNICA via para vender es el flujo de venta:
 * `POST /api/v1/autos/vehicles/{id}/sale` registra `vehicle_sales`, y de ahi
 * salen el ingreso 4010 y el costo 5010. Cambiar el estado a "vendido" desde la
 * edicion no crea esa fila, la venta no entra en contabilidad y el margen
 * queda en blanco: por eso la edicion NO ofrece "vendido".
 *
 * La moneda es la funcional del tenant (`localeDeTenant`); nunca se escribe a
 * mano. El importe viaja como string porque el backend lo lee como Decimal.
 */

import { normalizaImporte } from "./vehicle-manual";
import { ventaFiscalPayload, type VentaFiscalForm } from "./venta-fiscal";
import { postVehicleSale } from "@/lib/dealer/vehicle-economics-write";
import { accessApiErrorFromHttp, AccessApiError } from "@/lib/access/client";
import { apiFetch } from "@/lib/api/fetch-client";

export const SALE_STATUS = "vendido";
export const SALE_COMMISSION_REGISTER_PATH = "/api/v1/autos/vehicles/{vehicle_id}/sale/commissions";
export const SALE_COMMISSION_PAY_PATH = "/api/v1/autos/sale-commissions/{commission_id}/pay";
export const DEALER_SALE_COMMISSIONS_PATH = "/api/v1/autos/dealers/{dealer_id}/sale-commissions";

export type SaleCommissionCashAccount = "cash" | "bank";
export type SaleCommissionItem = {
  id: string;
  vehicle_id: string;
  salesperson_user_id: string;
  amount: string;
  currency: string;
  status: "pending" | "paid";
  sold_at: string | null;
  paid_at: string | null;
  month: string;
};
export type SaleCommissionSummary = {
  salesperson_user_id: string;
  month: string;
  currency: string;
  pending_amount: string;
  paid_amount: string;
  total_amount: string;
  pending_count: number;
  paid_count: number;
};
export type DealerSaleCommissions = {
  tz: string;
  items: SaleCommissionItem[];
  summary: SaleCommissionSummary[];
};

const SALE_COMMISSION_ERROR_MESSAGES: Record<string, string> = {
  SELF_PAYMENT_FORBIDDEN: "No puedes pagar una comisión asignada a tu propio usuario.",
  ALREADY_PAID: "Esta comisión ya fue pagada.",
  PAID_BEFORE_SALE: "La fecha de pago no puede ser anterior a la fecha de la venta.",
  DEALER_WITHOUT_UNIT: "El concesionario no tiene una unidad organizativa asignada; no se pudo completar la operación.",
  SALE_NOT_FOUND: "No hay una venta registrada para este vehículo.",
  SALESPERSON_NOT_ASSIGNED: "El vendedor no pertenece a este concesionario.",
  CURRENCY_MISMATCH: "La moneda debe coincidir con la moneda de la venta.",
  COMMISSION_NOT_FOUND: "No se encontró esta comisión.",
  DEALER_NOT_ASSIGNED: "Tu usuario no pertenece a este concesionario.",
  UNIT_MISMATCH: "La unidad organizativa no coincide con la de este concesionario.",
};

function commissionErrorCode(error: unknown): string | null {
  if (error instanceof AccessApiError) return error.reason_code;
  if (typeof error === "string") return error;
  if (!error || typeof error !== "object") return null;
  const row = error as Record<string, unknown>;
  if (typeof row.reason_code === "string") return row.reason_code;
  if (typeof row.code === "string") return row.code;
  const detail = row.detail;
  return detail && typeof detail === "object" ? commissionErrorCode(detail) : null;
}

export function commissionErrorMessage(error: unknown): string {
  const code = commissionErrorCode(error);
  if (code && SALE_COMMISSION_ERROR_MESSAGES[code]) return SALE_COMMISSION_ERROR_MESSAGES[code];
  if (error instanceof AccessApiError && error.status === 403) return "No tienes permiso para completar esta operación.";
  return "No se pudo completar la operación de comisión. Revisa los datos e inténtalo de nuevo.";
}

export function saleCommissionListUrl(dealerId: string, month: string, timeZone: string): string {
  const query = new URLSearchParams({ tz: timeZone });
  if (month) query.set("month", month);
  return `/api/v1/autos/dealers/${encodeURIComponent(dealerId)}/sale-commissions?${query.toString()}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function parseCommissionList(value: unknown): DealerSaleCommissions {
  if (!isRecord(value) || typeof value.tz !== "string" || !Array.isArray(value.items) || !Array.isArray(value.summary)) {
    throw new Error("Respuesta inválida del listado de comisiones");
  }
  const items = value.items;
  const summary = value.summary;
  const validItems = items.every((item) => isRecord(item) &&
    ["id", "vehicle_id", "salesperson_user_id", "amount", "currency", "month"].every((key) => typeof item[key] === "string") &&
    (item.status === "pending" || item.status === "paid") &&
    (item.sold_at === null || typeof item.sold_at === "string") &&
    (item.paid_at === null || typeof item.paid_at === "string"));
  const validSummary = summary.every((row) => isRecord(row) &&
    ["salesperson_user_id", "month", "currency", "pending_amount", "paid_amount", "total_amount"].every((key) => typeof row[key] === "string") &&
    typeof row.pending_count === "number" && typeof row.paid_count === "number");
  if (!validItems || !validSummary) throw new Error("Respuesta inválida del listado de comisiones");
  return value as unknown as DealerSaleCommissions;
}

async function commissionRequest<T>(path: string, tenantId: string, method: "GET" | "POST", body?: unknown): Promise<T> {
  const response = await apiFetch(path, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Tenant-ID": tenantId,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  let parsed: unknown = null;
  try {
    parsed = await response.json();
  } catch {
    parsed = null;
  }
  if (!response.ok) throw accessApiErrorFromHttp(response.status, parsed, path);
  return parsed as T;
}

export function listDealerSaleCommissions(
  tenantId: string,
  dealerId: string,
  month: string,
  timeZone: string,
): Promise<DealerSaleCommissions> {
  return commissionRequest<unknown>(saleCommissionListUrl(dealerId, month, timeZone), tenantId, "GET")
    .then(parseCommissionList);
}

export type DealerSalesperson = { user_id: string; email: string };

export async function listDealerSalespeople(tenantId: string, dealerId: string): Promise<DealerSalesperson[]> {
  const body = await commissionRequest<unknown>(`/api/v1/autos/dealers/${encodeURIComponent(dealerId)}/salespeople`, tenantId, "GET");
  if (!isRecord(body) || body.dealer_id !== dealerId || !Array.isArray(body.items) ||
      !body.items.every((item) => isRecord(item) && typeof item.user_id === "string" && item.user_id.trim() && typeof item.email === "string" && item.email.trim())) {
    throw new Error("Respuesta inv?lida del listado de vendedores");
  }
  return body.items as DealerSalesperson[];
}

export function registerSaleCommission(
  tenantId: string,
  vehicleId: string,
  input: { salesperson_user_id: string; amount: string; currency: string },
): Promise<unknown> {
  const path = SALE_COMMISSION_REGISTER_PATH.replace("{vehicle_id}", encodeURIComponent(vehicleId));
  return commissionRequest(path, tenantId, "POST", input);
}

export function paySaleCommission(
  tenantId: string,
  commissionId: string,
  cashAccount: SaleCommissionCashAccount,
): Promise<unknown> {
  const path = SALE_COMMISSION_PAY_PATH.replace("{commission_id}", encodeURIComponent(commissionId));
  return commissionRequest(path, tenantId, "POST", { cash_account: cashAccount });
}

export const SALE_BLOCKED_IN_EDIT_NOTE =
  "Para vender un vehículo usa «Registrar venta». Cambiar el estado a VENDIDO desde la edición no registra la venta ni entra en contabilidad.";

/** True si el estado es "vendido", sin importar mayusculas ni espacios. */
export function isSold(status: string | null | undefined): boolean {
  return (status ?? "").trim().toLowerCase() === SALE_STATUS;
}

/** Estados que la edicion puede ofrecer: todos menos "vendido". */
export function editableStatuses(all: readonly string[]): string[] {
  return all.filter((status) => !isSold(status));
}

/** True si el cambio de estado pedido desde la edicion debe bloquearse. */
export function blocksStatusChangeInEdit(target: string | null | undefined): boolean {
  return isSold(target);
}

export type SaleForm = { sale_price_amount: string; sold_at: string };
/** `fiscal` (alicuota y permuta) viaja aparte: SALE_FORM_EMPTY y validateSaleForm no cambian. */
export type SaleFormErrors = Partial<Record<keyof SaleForm | "currency", string>>;

export const SALE_FORM_EMPTY: SaleForm = { sale_price_amount: "", sold_at: "" };

/** Fecha y hora local en el formato del campo datetime-local ("2026-11-25T22:37"). */
export function ahoraLocal(d: Date = new Date()): string {
  const dos = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}T${dos(d.getHours())}:${dos(d.getMinutes())}`;
}

/** Formulario nuevo con la hora actual precargada (validacion Cowork 26-nov: una hora futura dejaba la comision impagable). */
export function saleFormNuevo(d: Date = new Date()): SaleForm {
  return { sale_price_amount: "", sold_at: ahoraLocal(d) };
}

export const SALE_DATE_FUTURE_MESSAGE = "La fecha y hora de la venta no puede ser posterior a ahora.";

export function validateSaleForm(form: SaleForm, currency: string | null, ahora: Date = new Date()): SaleFormErrors {
  const errors: SaleFormErrors = {};
  if (!currency || !/^[A-Z]{3}$/.test(currency.trim().toUpperCase())) {
    errors.currency = "Falta la moneda del concesionario. No se registra la venta con una moneda inventada.";
  }
  if (normalizaImporte(form.sale_price_amount) === null) {
    errors.sale_price_amount = "Escribe el precio de venta, mayor que cero (por ejemplo 18.500.000,50).";
  }
  if (!form.sold_at.trim() || Number.isNaN(Date.parse(form.sold_at))) {
    errors.sold_at = "Indica la fecha y hora de la venta.";
  } else if (Date.parse(form.sold_at) > ahora.getTime() + 60_000) {
    errors.sold_at = SALE_DATE_FUTURE_MESSAGE;
  }
  return errors;
}

export type SalePaymentMethod = "cash" | "bank" | "pending";
export type CompradorYPago = { buyer_contact_id: string; buyer_name: string; payment_method: SalePaymentMethod | "" };
export const COMPRADOR_Y_PAGO_EMPTY: CompradorYPago = { buyer_contact_id: "", buyer_name: "", payment_method: "" };
export const PAYMENT_METHOD_LABELS: Record<SalePaymentMethod, string> = {
  cash: "Contado en efectivo",
  bank: "Contado por banco o transferencia",
  pending: "Queda a cobrar (financiado o cuenta corriente)",
};

/** Decision de Cesar 26-nov: la venta pide comprador y forma de pago. */
export function validateCompradorYPago(v: CompradorYPago): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!v.buyer_contact_id) errors.buyer_contact_id = "Elige el comprador. Si no está en tus contactos, dalo de alta primero.";
  if (!v.payment_method) errors.payment_method = "Elige la forma de pago.";
  return errors;
}

export async function registerSale(
  vehicleId: string,
  tenantId: string,
  form: SaleForm,
  currency: string,
  fiscal?: VentaFiscalForm,
  compradorYPago?: CompradorYPago,
): Promise<unknown> {
  const amount = normalizaImporte(form.sale_price_amount);
  if (amount === null) throw new Error("sale_price_amount invalido");
  return postVehicleSale(vehicleId, tenantId, {
    sale_price_amount: amount,
    currency: currency.trim().toUpperCase(),
    sold_at: new Date(form.sold_at).toISOString(),
    ...(fiscal ? { fiscal: ventaFiscalPayload(fiscal) } : {}),
    ...(compradorYPago?.buyer_contact_id ? { buyer_contact_id: compradorYPago.buyer_contact_id } : {}),
    ...(compradorYPago?.payment_method ? { payment_method: compradorYPago.payment_method } : {}),
  });
}

/** Country-specific validation kept inside DASH-DEALER-FICHA. */
export function validateSaleVat(fiscal: VentaFiscalForm, country: string | null): Record<string, string> {
  if (country === "AR" && !fiscal.vat_rate.trim()) return {
    vat_rate: "Indica la alícuota del IVA de la venta (por ejemplo 21, 10,5 o 0).",
  };
  if (country === "DO" && fiscal.vat_rate !== "18") return { vat_rate: "En República Dominicana el ITBIS es 18." };
  return {};
}

export const SALE_VAT_MESSAGES: Record<string, string> = {
  SALE_VAT_RATE_REQUIRED: "Falta la alícuota del IVA (o el ITBIS).",
  SALE_VAT_RATE_INVALID: "En República Dominicana el ITBIS es 18.",
  SALE_VAT_BASE_UNKNOWN: "La compra no tiene datos fiscales: complétalos antes de vender.",
  SALE_DATE_IN_FUTURE: SALE_DATE_FUTURE_MESSAGE,
  VEHICLE_ALREADY_SOLD: "Este vehículo ya está vendido.",
  BUYER_NOT_FOUND: "El comprador elegido ya no está en tus contactos. Elige otro.",
  SALE_PAYMENT_FX_REQUIRED: "Una venta en otra moneda cobrada al contado necesita el tipo de cambio: elige 'Queda a cobrar' y carga el cobro aparte.",
};

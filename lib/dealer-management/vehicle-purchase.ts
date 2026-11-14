/**
 * Compra en el alta de vehiculo (F4C-5, 3.1 de backend#2548).
 *
 * Validacion en pantalla ANTES de enviar y payload de la compra. Los importes
 * viajan como string decimal (es dinero). La suma de pagos se compara en
 * centavos enteros: nunca con coma flotante. La moneda funcional la aporta el
 * tenant; si la compra es en otra, se exige tipo de cambio y su fuente.
 *
 * Nada se inventa: lo vacio se omite y el contacto vendedor solo viaja si el
 * selector lo entrega (no se crean contactos desde aqui).
 */

import { normalizaImporte } from "@/lib/dealer-management/vehicle-manual";
import { vehicleCreatePayload, type VehicleManualForm, type VehicleDealerIdentity } from "./vehicle-manual";
import { apiFetch } from "@/lib/api/fetch-client";
import { accessApiErrorFromHttp } from "@/lib/access/client";

export const PAYMENT_METHODS = [
  { value: "cash", label: "Efectivo" },
  { value: "transfer", label: "Transferencia" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Otro" },
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]["value"];

/** Lista fija de fuentes del tipo de cambio. */
export const FX_SOURCES = [
  { value: "oficial_bna", label: "Oficial BNA" },
  { value: "mep", label: "MEP" },
  { value: "blue", label: "Blue" },
  { value: "acordado", label: "Acordado" },
  { value: "otra", label: "Otra" },
] as const;

export type PaymentLine = {
  method: PaymentMethod;
  amount: string;
  cheque_number: string;
  bank: string;
  cobro_date: string;
  detail: string;
};

export type PurchaseDocs = { titulo: boolean; form_08: boolean; cedula: boolean; vtv: boolean; cheque: boolean };

export const DOC_ITEMS: { key: keyof PurchaseDocs; label: string }[] = [
  { key: "titulo", label: "Título" },
  { key: "form_08", label: "Formulario 08" },
  { key: "cedula", label: "Cédula" },
  { key: "vtv", label: "VTV" },
  { key: "cheque", label: "Cheque" },
];

export type PurchaseForm = {
  cost: string;
  acquired_on: string;
  currency: string;
  fx_rate: string;
  fx_source: string;
  fx_source_detail: string;
  payment_lines: PaymentLine[];
  docs: PurchaseDocs;
  engine_number: string;
  seller_contact_id: string;
  country_code: string;
  acquisition_mode_code: string;
  fx_as_of: string;
};

export const EMPTY_LINE: PaymentLine = {
  method: "cash",
  amount: "",
  cheque_number: "",
  bank: "",
  cobro_date: "",
  detail: "",
};

export const PURCHASE_EMPTY: PurchaseForm = {
  cost: "",
  acquired_on: "",
  currency: "",
  fx_rate: "",
  fx_source: "",
  fx_source_detail: "",
  payment_lines: [EMPTY_LINE],
  docs: { titulo: false, form_08: false, cedula: false, vtv: false, cheque: false },
  engine_number: "",
  seller_contact_id: "",
  country_code: "",
  acquisition_mode_code: "",
  fx_as_of: "",
};

export type PurchaseErrors = Record<string, string>;

/** "1.234,50" -> 123450 centavos; null si no es un importe. */
export function centavos(texto: string): number | null {
  const valor = normalizaImporte(texto);
  if (valor === null) return null;
  const [entero, dec = ""] = valor.split(".");
  const n = Number(entero) * 100 + Number(dec.padEnd(2, "0"));
  return Number.isSafeInteger(n) && n > 0 && n <= 99999999999999 ? n : null;
}

/** Suma de las lineas de pago en centavos; las lineas sin importe valido no suman. */
export function sumaPagos(lines: PaymentLine[]): number {
  return lines.reduce((acc, line) => acc + (centavos(line.amount) ?? 0), 0);
}

const dateOK = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v;

/** Fail-closed: sin moneda funcional conocida no se puede afirmar que coincida, asi que se exige tipo de cambio. */
function needsFx(moneda: string, functionalCurrency: string | null): boolean {
  return !functionalCurrency || !functionalCurrency.trim() || moneda !== functionalCurrency.trim().toUpperCase();
}

export function validatePurchase(form: PurchaseForm, functionalCurrency: string | null = null): PurchaseErrors {
  const errors: PurchaseErrors = {};
  const costo = centavos(form.cost);
  if (!form.cost.trim()) errors.cost = "El costo es obligatorio.";
  else if (costo === null) errors.cost = "Ingresa un costo mayor que cero, por ejemplo 18500000,50.";
  if (!dateOK(form.acquired_on)) errors.acquired_on = "Indica una fecha de adquisición válida.";
  if (!/^[A-Za-z]{2}$/.test(form.country_code)) errors.country_code = "Indica el país de adquisición (2 letras).";
  if (!form.acquisition_mode_code.trim() || form.acquisition_mode_code.length > 40) errors.acquisition_mode_code = "Indica el código de adquisición vigente en tu concesionario.";
  if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(form.seller_contact_id)) errors.seller_contact_id = "Selecciona el contacto vendedor.";
  if (form.engine_number.length > 40) errors.engine_number = "El número de motor admite hasta 40 caracteres.";

  const moneda = form.currency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(moneda)) errors.currency = "Indica la moneda con su código de 3 letras, por ejemplo ARS.";
  if (needsFx(moneda, functionalCurrency)) {
    if (!/^\d+(?:[.,]\d{1,6})?$/.test(form.fx_rate) || Number(form.fx_rate.replace(",", ".")) <= 0 || Number(form.fx_rate.replace(",", ".")) >= 1e12) {
      errors.fx_rate = "Indica el tipo de cambio (mayor que cero).";
    }
    if (!FX_SOURCES.some((s) => s.value === form.fx_source)) errors.fx_source = "Elige la fuente del tipo de cambio.";
    if (!dateOK(form.fx_as_of)) errors.fx_as_of = "Indica la fecha del tipo de cambio.";
  }
  if (needsFx(moneda, functionalCurrency) && form.fx_source === "otra" && !form.fx_source_detail.trim()) {
    errors.fx_source_detail = "Falta el detalle de la fuente del tipo de cambio.";
  }

  form.payment_lines.forEach((line, i) => {
    if (!PAYMENT_METHODS.some((m) => m.value === line.method)) errors[`payment_${i}_method`] = "Medio de pago inválido.";
    if (centavos(line.amount) === null) errors[`payment_${i}_amount`] = "Ingresa el importe de este pago.";
    if (line.method === "cheque") {
      if (!line.cheque_number.trim()) errors[`payment_${i}_cheque_number`] = "Falta el número del cheque.";
      if (!line.bank.trim()) errors[`payment_${i}_bank`] = "Falta el banco del cheque.";
      if (!dateOK(line.cobro_date)) errors[`payment_${i}_cobro_date`] = "Falta la fecha de cobro del cheque.";
    }
    if (line.method === "other" && !line.detail.trim()) errors[`payment_${i}_detail`] = "Describe este pago.";
  });
  if (form.payment_lines.length > 20) errors.payment_sum = "Se admiten hasta 20 líneas de pago.";
  if (form.payment_lines.length === 0) errors.payment_sum = "Agrega al menos una línea de pago.";
  else if (costo !== null && sumaPagos(form.payment_lines) !== costo) {
    errors.payment_sum = "La suma de los pagos no coincide con el costo.";
  }
  return errors;
}

/** CompraIn del backend main 1e27340e. Sin documentación: POST purchase no la acepta. */
export function purchasePayload(form: PurchaseForm, functionalCurrency: string | null): Record<string, unknown> {
  const errors = validatePurchase(form, functionalCurrency);
  if (Object.keys(errors).length) throw new Error(Object.values(errors).join(" "));
  const methods = { cash: "efectivo", transfer: "transferencia", cheque: "cheque", other: "otro" };
  const payload: Record<string, unknown> = {
    amount: normalizaImporte(form.cost),
    currency: form.currency.trim().toUpperCase(),
    acquired_at: form.acquired_on, country_code: form.country_code.toUpperCase(),
    acquisition_mode_code: form.acquisition_mode_code.trim(), seller_contact_id: form.seller_contact_id,
    payments: form.payment_lines.map((line) => {
      const out: Record<string, unknown> = { method: methods[line.method], amount: normalizaImporte(line.amount) };
      if (line.method === "cheque") {
        out.check_number = line.cheque_number.trim();
        out.check_bank = line.bank.trim();
        out.check_cash_date = line.cobro_date;
      }
      if (line.method === "other") out.detail = line.detail.trim();
      return out;
    }),
  };
  if (needsFx(form.currency.trim().toUpperCase(), functionalCurrency)) payload.fx = { rate: form.fx_rate.replace(",", "."), source: form.fx_source, detail: form.fx_source === "otra" ? form.fx_source_detail.trim() : undefined, as_of: `${form.fx_as_of}T00:00:00Z` };
  return payload;
}

export async function createVehiclePurchase(
  context: VehicleDealerIdentity,
  vehicle: VehicleManualForm,
  form: PurchaseForm,
  functionalCurrency: string | null,
  idempotencyKey: string,
) {
  const purchase = purchasePayload(form, functionalCurrency);
  const path = `/api/v1/autos/tenants/${encodeURIComponent(context.tenantId)}/dealers/${encodeURIComponent(context.dealerId)}/vehicles/purchase`;
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Tenant-ID": context.tenantId,
    "X-Dealer-ID": context.dealerId,
    "Idempotency-Key": idempotencyKey,
  };
  if (context.organizationUnitId) headers["X-Organization-Unit-ID"] = context.organizationUnitId;
  const response = await apiFetch(path, {
    method: "POST",
    headers,
    body: JSON.stringify({ ...vehicleCreatePayload(vehicle), purchase, engine_number: form.engine_number.trim() || undefined }),
  });
  const parsed: unknown = await response.json().catch(() => null);
  if (!response.ok) throw accessApiErrorFromHttp(response.status, parsed, path);
  return parsed;
}

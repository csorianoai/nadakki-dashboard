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
};

export type PurchaseErrors = Record<string, string>;

/** "1.234,50" -> 123450 centavos; null si no es un importe. */
export function centavos(texto: string): number | null {
  const valor = normalizaImporte(texto);
  if (valor === null) return null;
  const [entero, dec = ""] = valor.split(".");
  return Number(entero) * 100 + Number(dec.padEnd(2, "0"));
}

/** Suma de las lineas de pago en centavos; las lineas sin importe valido no suman. */
export function sumaPagos(lines: PaymentLine[]): number {
  return lines.reduce((acc, line) => acc + (centavos(line.amount) ?? 0), 0);
}

export function validatePurchase(form: PurchaseForm, functionalCurrency: string | null): PurchaseErrors {
  const errors: PurchaseErrors = {};
  const costo = centavos(form.cost);
  if (!form.cost.trim()) errors.cost = "El costo es obligatorio.";
  else if (costo === null) errors.cost = "Ingresa un costo mayor que cero, por ejemplo 18500000,50.";

  const moneda = form.currency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(moneda)) errors.currency = "Indica la moneda con su código de 3 letras, por ejemplo ARS.";
  else if (functionalCurrency && moneda !== functionalCurrency.trim().toUpperCase()) {
    if (!form.fx_rate.trim() || normalizaImporte(form.fx_rate) === null) {
      errors.fx_rate = "Indica el tipo de cambio (mayor que cero).";
    }
    if (!FX_SOURCES.some((s) => s.value === form.fx_source)) errors.fx_source = "Elige la fuente del tipo de cambio.";
  }
  if (form.fx_source === "otra" && !form.fx_source_detail.trim()) {
    errors.fx_source_detail = "Falta el detalle de la fuente del tipo de cambio.";
  }

  form.payment_lines.forEach((line, i) => {
    if (centavos(line.amount) === null) errors[`payment_${i}_amount`] = "Ingresa el importe de este pago.";
    if (line.method === "cheque") {
      if (!line.cheque_number.trim()) errors[`payment_${i}_cheque_number`] = "Falta el número del cheque.";
      if (!line.bank.trim()) errors[`payment_${i}_bank`] = "Falta el banco del cheque.";
      if (!line.cobro_date.trim()) errors[`payment_${i}_cobro_date`] = "Falta la fecha de cobro del cheque.";
    }
    if (line.method === "other" && !line.detail.trim()) errors[`payment_${i}_detail`] = "Describe este pago.";
  });
  if (form.payment_lines.length === 0) errors.payment_sum = "Agrega al menos una línea de pago.";
  else if (costo !== null && sumaPagos(form.payment_lines) !== costo) {
    errors.payment_sum = "La suma de los pagos no coincide con el costo.";
  }
  return errors;
}

function opt(value: string): string | undefined {
  const t = value.trim();
  return t ? t : undefined;
}

/** Payload de la compra, solo con lo que el dealer cargo. */
export function purchasePayload(form: PurchaseForm): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    cost: normalizaImporte(form.cost),
    currency: form.currency.trim().toUpperCase(),
    payment_lines: form.payment_lines.map((line) => {
      const out: Record<string, unknown> = { method: line.method, amount: normalizaImporte(line.amount) };
      if (line.method === "cheque") {
        out.cheque_number = line.cheque_number.trim();
        out.bank = line.bank.trim();
        out.cobro_date = line.cobro_date.trim();
      }
      if (line.method === "other") out.detail = line.detail.trim();
      return out;
    }),
    documentation: {
      titulo: form.docs.titulo,
      form_08: form.docs.form_08,
      cedula: form.docs.cedula,
      vtv: form.docs.vtv,
      cheque: form.docs.cheque,
    },
  };
  const extras: Record<string, string | undefined> = {
    acquired_on: opt(form.acquired_on),
    fx_rate: opt(form.fx_rate) ? (normalizaImporte(form.fx_rate) ?? undefined) : undefined,
    fx_source: opt(form.fx_source),
    fx_source_detail: form.fx_source === "otra" ? opt(form.fx_source_detail) : undefined,
    engine_number: opt(form.engine_number),
    seller_contact_id: opt(form.seller_contact_id),
  };
  for (const [key, value] of Object.entries(extras)) if (value !== undefined) payload[key] = value;
  return payload;
}

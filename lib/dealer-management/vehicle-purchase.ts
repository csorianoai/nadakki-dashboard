import { apiFetch } from "@/lib/api/fetch-client";
import { accessApiErrorFromHttp } from "@/lib/access/client";
import { normalizaImporte, vehicleCreatePayload, type VehicleManualForm, type VehicleDealerIdentity } from "./vehicle-manual";

export const FX_SOURCES = ["oficial_bna", "mep", "blue", "acordado", "otra"] as const;
export type Payment = { method: string; amount: string; check_number: string; check_bank: string; check_cash_date: string; detail: string };
export type PurchaseForm = {
  amount: string; currency: string; acquired_at: string; country_code: string; acquisition_mode_code: string;
  seller_contact_id: string; engine_number: string; payments: Payment[];
  fx_rate: string; fx_source: string; fx_detail: string; fx_as_of: string;
};
export const emptyPayment = (): Payment => ({ method: "efectivo", amount: "", check_number: "", check_bank: "", check_cash_date: "", detail: "" });
export const emptyPurchase = (): PurchaseForm => ({ amount: "", currency: "", acquired_at: "", country_code: "", acquisition_mode_code: "", seller_contact_id: "", engine_number: "", payments: [emptyPayment()], fx_rate: "", fx_source: "", fx_detail: "", fx_as_of: "" });
const cents = (v: string): number | null => {
  const n = normalizaImporte(v); if (n === null) return null;
  const [a, b = ""] = n.split("."); const value = Number(a) * 100 + Number(b.padEnd(2, "0"));
  return Number.isSafeInteger(value) && value > 0 && value <= 99999999999999 ? value : null;
};
const dateOK = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v;
export function validatePurchase(p: PurchaseForm): string[] {
  const errors: string[] = []; const cost = cents(p.amount);
  if (cost === null) errors.push("El costo es obligatorio y debe ser mayor que cero (hasta 2 decimales).");
  if (!/^[A-Za-z]{3}$/.test(p.currency)) errors.push("Indica la moneda de compra (3 letras).");
  if (!dateOK(p.acquired_at)) errors.push("Indica una fecha de adquisición válida.");
  if (!/^[A-Za-z]{2}$/.test(p.country_code)) errors.push("Indica el país de adquisición (2 letras).");
  if (!p.acquisition_mode_code.trim() || p.acquisition_mode_code.length > 40) errors.push("Indica el modo de adquisición vigente en tu concesionario.");
  if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(p.seller_contact_id)) errors.push("Selecciona el contacto vendedor.");
  if (!p.payments.length || p.payments.length > 20) errors.push("Carga entre 1 y 20 líneas de pago.");
  let total = 0;
  p.payments.forEach((pay, i) => {
    const value = cents(pay.amount); total += value ?? 0;
    if (value === null || !["efectivo", "transferencia", "cheque", "otro"].includes(pay.method)) errors.push(`Pago ${i + 1}: importe o método inválido.`);
    if (pay.method === "cheque" && !dateOK(pay.check_cash_date)) errors.push(`Pago ${i + 1}: el cheque exige fecha de cobro.`);
    if (pay.method === "otro" && !pay.detail.trim()) errors.push(`Pago ${i + 1}: indica el detalle de otro medio.`);
    if (pay.check_number.length > 40 || pay.check_bank.length > 80 || pay.detail.length > 200) errors.push(`Pago ${i + 1}: texto demasiado largo.`);
  });
  if (cost !== null && total !== cost) errors.push("La suma de pagos debe ser igual al costo.");
  if (p.engine_number.length > 40) errors.push("El número de motor admite hasta 40 caracteres.");
  if (p.fx_rate || p.fx_source || p.fx_detail || p.fx_as_of) {
    if (!/^\d+(?:[.,]\d{1,6})?$/.test(p.fx_rate) || Number(p.fx_rate.replace(",", ".")) <= 0 || Number(p.fx_rate.replace(",", ".")) >= 1e12) errors.push("Indica una tasa de cambio positiva (hasta 6 decimales).");
    if (!(FX_SOURCES as readonly string[]).includes(p.fx_source)) errors.push("Selecciona la fuente del tipo de cambio.");
    if (p.fx_source === "otra" && !p.fx_detail.trim()) errors.push("Otra fuente exige detalle.");
    if (p.fx_detail.length > 200) errors.push("El detalle de fuente admite hasta 200 caracteres.");
    if (!dateOK(p.fx_as_of)) errors.push("Indica la fecha del tipo de cambio.");
  }
  return errors;
}
export function purchasePayload(p: PurchaseForm) {
  const errors = validatePurchase(p); if (errors.length) throw new Error(errors.join(" "));
  return { amount: normalizaImporte(p.amount), currency: p.currency.toUpperCase(), acquired_at: p.acquired_at,
    country_code: p.country_code.toUpperCase(), acquisition_mode_code: p.acquisition_mode_code.trim(), seller_contact_id: p.seller_contact_id,
    payments: p.payments.map((pay) => ({ method: pay.method, amount: normalizaImporte(pay.amount),
      ...(pay.method === "cheque" ? { check_number: pay.check_number || undefined, check_bank: pay.check_bank || undefined, check_cash_date: pay.check_cash_date } : {}),
      detail: pay.detail.trim() || undefined })),
    ...(p.fx_rate ? { fx: { rate: p.fx_rate.replace(",", "."), source: p.fx_source, detail: p.fx_source === "otra" ? p.fx_detail.trim() : undefined, as_of: `${p.fx_as_of}T00:00:00Z` } } : {}),
  };
}
export async function createVehiclePurchase(context: VehicleDealerIdentity, vehicle: VehicleManualForm, p: PurchaseForm) {
  const body = { ...vehicleCreatePayload(vehicle), purchase: purchasePayload(p), engine_number: p.engine_number.trim() || undefined };
  const path = `/api/v1/autos/tenants/${encodeURIComponent(context.tenantId)}/dealers/${encodeURIComponent(context.dealerId)}/vehicles/purchase`;
  const response = await apiFetch(path, { method: "POST", body: JSON.stringify(body) });
  const parsed: unknown = await response.json().catch(() => null);
  if (!response.ok) throw accessApiErrorFromHttp(response.status, parsed, path);
  return parsed;
}

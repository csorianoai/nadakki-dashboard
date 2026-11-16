/**
 * F4F-6 parte 3: lo que la venta pide y muestra de F4F-3 (criterio del contador, puntos 2 y 5; las senas van en la parte 4).
 * - Alicuota del IVA: la escribe quien vende; NO hay valor por defecto (el contador no la informo).
 * - Base del IVA: la deriva el backend segun como se compro; aqui NUNCA se envia ni se edita.
 * - Permuta: el usado recibido viaja dentro de la venta (`trade_in`).
 * Cheque diferido como medio de pago: el contrato de venta de F4F-3 no recibe medios de pago, asi que no se inventa.
 */
import { normalizaImporte } from "@/lib/dealer-management/vehicle-manual";

export type VentaFiscalForm = {
  vat_rate: string;
  trade_in: boolean;
  ti_value: string;
  ti_acquisition_mode_code: string;
  ti_make: string;
  ti_model: string;
  ti_year: string;
  ti_vin: string;
  ti_mileage_km: string;
  ti_plate: string;
};

export const VENTA_FISCAL_EMPTY: VentaFiscalForm = {
  vat_rate: "", trade_in: false, ti_value: "", ti_acquisition_mode_code: "", ti_make: "", ti_model: "",
  ti_year: "", ti_vin: "", ti_mileage_km: "", ti_plate: "",
};

export const ORIGEN_USADO = [
  { value: "compra_local", label: "Comprado (con o sin factura)" },
  { value: "consignacion", label: "Consignado" },
] as const;

const tasa = (t: string): string | null =>
  /^\d{1,3}(?:[.,]\d{1,2})?$/.test(t.trim()) && Number(t.replace(",", ".")) <= 100 ? t.trim().replace(",", ".") : null;

export function validateVentaFiscal(f: VentaFiscalForm): Record<string, string> {
  const e: Record<string, string> = {};
  if (f.vat_rate.trim() && tasa(f.vat_rate) === null) {
    e.vat_rate = "La alícuota del IVA es un porcentaje entre 0 y 100 (por ejemplo 21 o 10,5).";
  }
  if (!f.trade_in) return e;
  if (normalizaImporte(f.ti_value) === null) e.ti_value = "Indica el valor de toma del usado, mayor que cero.";
  if (!ORIGEN_USADO.some((o) => o.value === f.ti_acquisition_mode_code)) {
    e.ti_acquisition_mode_code = "Indica si el usado es consignado o comprado.";
  }
  if (!f.ti_make.trim()) e.ti_make = "Indica la marca del usado.";
  if (!f.ti_model.trim()) e.ti_model = "Indica el modelo del usado.";
  if (!/^\d{4}$/.test(f.ti_year.trim()) || Number(f.ti_year) < 1900 || Number(f.ti_year) > 2050) {
    e.ti_year = "Indica el año del usado (cuatro cifras).";
  }
  if (f.ti_vin.trim() && !/^[A-HJ-NPR-Z0-9]{17}$/i.test(f.ti_vin.trim())) {
    e.ti_vin = "El VIN tiene 17 caracteres (sin I, O ni Q) o déjalo vacío.";
  }
  if (f.ti_mileage_km.trim() && !/^\d{1,7}$/.test(f.ti_mileage_km.trim())) {
    e.ti_mileage_km = "Los kilómetros son un número entero.";
  }
  return e;
}

/** Campos fiscales de SaleIn. Nunca incluye `vat_base`: el backend lo rechaza y lo deriva solo. */
export function ventaFiscalPayload(f: VentaFiscalForm): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const rate = tasa(f.vat_rate);
  if (rate !== null) out.vat = { rate };
  if (f.trade_in) {
    const t: Record<string, unknown> = {
      value: normalizaImporte(f.ti_value) ?? "", acquisition_mode_code: f.ti_acquisition_mode_code,
      make: f.ti_make.trim(), model: f.ti_model.trim(), year: Number(f.ti_year),
    };
    if (f.ti_vin.trim()) t.vin = f.ti_vin.trim().toUpperCase();
    if (f.ti_mileage_km.trim()) t.mileage_km = Number(f.ti_mileage_km);
    if (f.ti_plate.trim()) t.plate = f.ti_plate.trim();
    out.trade_in = t;
  }
  return out;
}

export const NO_DISPONIBLE = "Disponible cuando se active la contabilidad fiscal.";

const MENSAJES: Record<string, string> = {
  ESQUEMA_FISCAL_NO_APLICADO: NO_DISPONIBLE + " Todavía no se pueden guardar el IVA ni la permuta; no se guardó nada.",
  SALE_VAT_BASE_UNKNOWN:
    "La compra de este vehículo no tiene factura cargada ni dato fiscal del vendedor. Cárgalo antes de vender con IVA: el sistema no supone la base.",
  SALE_COST_UNKNOWN: "El vehículo no tiene costo de compra: sin él no se calcula la diferencia sobre la que va el IVA.",
  SALE_CURRENCY_MISMATCH:
    "La venta y el costo de compra están en monedas distintas. Registra la venta en la moneda de la compra.",
};

/** Texto llano para un reason_code conocido; null si no se conoce (no se inventa). */
export const mensajeVenta = (code: string | null | undefined): string | null => (code ? (MENSAJES[code] ?? null) : null);

export const BASE_IVA_TEXTO: Record<string, string> = {
  diferencia: "La diferencia entre la venta y el costo",
  total: "El precio completo de la venta",
};

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
import { postVehicleSale } from "@/lib/dealer/vehicle-economics-write";

export const SALE_STATUS = "vendido";

export const SALE_BLOCKED_IN_EDIT_NOTE =
  "Para vender un vehículo usá «Registrar venta». Cambiar el estado a VENDIDO desde la edición no registra la venta ni entra en contabilidad.";

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
export type SaleFormErrors = Partial<Record<keyof SaleForm | "currency", string>>;

export const SALE_FORM_EMPTY: SaleForm = { sale_price_amount: "", sold_at: "" };

export function validateSaleForm(form: SaleForm, currency: string | null): SaleFormErrors {
  const errors: SaleFormErrors = {};
  if (!currency || !/^[A-Z]{3}$/.test(currency.trim().toUpperCase())) {
    errors.currency = "Falta la moneda del concesionario. No se registra la venta con una moneda inventada.";
  }
  if (normalizaImporte(form.sale_price_amount) === null) {
    errors.sale_price_amount = "Escribí el precio de venta, mayor que cero (por ejemplo 18.500.000,50).";
  }
  if (!form.sold_at.trim() || Number.isNaN(Date.parse(form.sold_at))) {
    errors.sold_at = "Indicá la fecha y hora de la venta.";
  }
  return errors;
}

export async function registerSale(
  vehicleId: string,
  tenantId: string,
  form: SaleForm,
  currency: string,
): Promise<unknown> {
  const amount = normalizaImporte(form.sale_price_amount);
  if (amount === null) throw new Error("sale_price_amount invalido");
  return postVehicleSale(vehicleId, tenantId, {
    sale_price_amount: amount,
    currency: currency.trim().toUpperCase(),
    sold_at: new Date(form.sold_at).toISOString(),
  });
}

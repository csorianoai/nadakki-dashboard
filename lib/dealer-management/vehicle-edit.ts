/**
 * Edicion de precio, referencia, dominio y n.o de stock, y el paso a DISPONIBLE
 * (P2 del backend, #1545 y #1564).
 *
 * Las dos cosas van por la MISMA ruta del contrato --
 * `PATCH /api/v1/autos/tenants/{t}/dealers/{d}/vehicles/{v}`-- pero NUNCA en el
 * mismo cuerpo: `status` no se combina con campos materiales (422
 * `STATUS_NOT_COMBINABLE`). Por eso hay dos funciones y dos botones.
 *
 * Solo se manda lo que cambio. Una pareja (referencia o dominio) se manda
 * entera si cambia cualquiera de sus dos mitades: el backend valida el estado
 * resultante, pero mandar la pareja completa deja la intencion explicita.
 */

import { accessApiErrorFromHttp } from "@/lib/access/client";
import { apiFetch } from "@/lib/api/fetch-client";
import type { DealerVehicleStatusRow } from "@/lib/dealer/vehicle-status";
import {
  VEHICLE_FORM_EMPTY,
  normalizaImporte,
  priceAndPlatePayload,
  validatePriceAndPlate,
  type VehicleDealerIdentity,
  type VehicleFormErrors,
  type VehicleManualForm,
} from "@/lib/dealer-management/vehicle-manual";

/** Desde estos estados el backend admite pasar a `disponible` (STATUS_TRANSITIONS). */
export const ESTADOS_PUBLICABLES = new Set(["draft", "archivado"]);

/** Lo que la ficha devuelve, en la forma del formulario. */
export function formDeFicha(ficha: DealerVehicleStatusRow): VehicleManualForm {
  return {
    ...VEHICLE_FORM_EMPTY,
    price_amount: ficha.price_amount ?? "",
    display_price_amount: ficha.display_price_amount ?? "",
    display_price_currency: ficha.display_price_currency ?? "",
    plate: ficha.plate ?? "",
    plate_country: ficha.plate_country ?? "",
    stock_number: ficha.stock_number ?? "",
  };
}

const NO_SE_BORRA = "Una vez cargado no se puede dejar vacío; escribí el valor correcto.";

/**
 * Las reglas del alta mas una propia de la edicion: el contrato no permite
 * borrar precio, referencia, dominio ni stock con un PATCH (el importe es
 * `gt=0` y los textos `min_length=1`), asi que se dice aqui y no con un 422.
 */
export function validarEdicion(
  form: VehicleManualForm,
  original: VehicleManualForm,
  functionalCurrency: string | null,
): VehicleFormErrors {
  const errors = validatePriceAndPlate(form, functionalCurrency);
  for (const campo of ["price_amount", "display_price_amount", "plate", "stock_number"] as const) {
    if (original[campo].trim() && !form[campo].trim()) errors[campo] = NO_SE_BORRA;
  }
  return errors;
}

function mismoImporte(a: string, b: string): boolean {
  const na = normalizaImporte(a);
  const nb = normalizaImporte(b);
  return na !== null && nb !== null ? Number(na) === Number(nb) : a.trim() === b.trim();
}

/** Solo lo que cambio respecto de la ficha. Vacio = no hay nada que guardar. */
export function cambiosDeEdicion(form: VehicleManualForm, original: VehicleManualForm): Record<string, string> {
  const todo = priceAndPlatePayload(form);
  const cambios: Record<string, string> = {};
  const igualTexto = (campo: keyof VehicleManualForm) =>
    form[campo].trim().toUpperCase() === original[campo].trim().toUpperCase();

  if ("price_amount" in todo && !mismoImporte(form.price_amount, original.price_amount)) {
    cambios.price_amount = todo.price_amount;
  }
  if (
    "display_price_amount" in todo &&
    (!mismoImporte(form.display_price_amount, original.display_price_amount) || !igualTexto("display_price_currency"))
  ) {
    cambios.display_price_amount = todo.display_price_amount;
    cambios.display_price_currency = todo.display_price_currency;
  }
  if ("plate" in todo && (!igualTexto("plate") || !igualTexto("plate_country"))) {
    cambios.plate = todo.plate;
    cambios.plate_country = todo.plate_country;
  }
  if ("stock_number" in todo && form.stock_number.trim() !== original.stock_number.trim()) {
    cambios.stock_number = todo.stock_number;
  }
  return cambios;
}

/**
 * Algo del formulario difiere de lo guardado, aunque no se pueda guardar (un
 * precio borrado no es un cambio para el PATCH, pero si para la pantalla).
 * Mismas equivalencias que `cambiosDeEdicion`: importes por valor, dominio y
 * monedas sin distinguir mayusculas.
 */
export function hayCambiosSinGuardar(form: VehicleManualForm, original: VehicleManualForm): boolean {
  return (Object.keys(original) as (keyof VehicleManualForm)[]).some((campo) => {
    const actual = form[campo] ?? "";
    const guardado = original[campo] ?? "";
    if (campo === "price_amount" || campo === "display_price_amount") return !mismoImporte(actual, guardado);
    if (campo === "stock_number") return actual.trim() !== guardado.trim();
    return actual.trim().toUpperCase() !== guardado.trim().toUpperCase();
  });
}

async function patchVehicle(
  context: VehicleDealerIdentity,
  vehicleId: string,
  body: Record<string, string>,
  idempotencyKey?: string,
): Promise<unknown> {
  const tenant = encodeURIComponent(context.tenantId);
  const dealer = encodeURIComponent(context.dealerId);
  const path = `/api/v1/autos/tenants/${tenant}/dealers/${dealer}/vehicles/${encodeURIComponent(vehicleId)}`;
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Tenant-ID": context.tenantId,
    "X-Dealer-ID": context.dealerId,
  };
  if (context.organizationUnitId) headers["X-Organization-Unit-ID"] = context.organizationUnitId;
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  const response = await apiFetch(path, { method: "PATCH", headers, body: JSON.stringify(body) });
  let parsed: unknown = null;
  try {
    parsed = await response.json();
  } catch {
    parsed = null;
  }
  if (!response.ok) throw accessApiErrorFromHttp(response.status, parsed, path);
  return parsed;
}

export function guardarEdicion(
  context: VehicleDealerIdentity,
  vehicleId: string,
  cambios: Record<string, string>,
  idempotencyKey?: string,
): Promise<unknown> {
  return patchVehicle(context, vehicleId, cambios, idempotencyKey);
}

/** Publicar: el cuerpo es SOLO `status`, como manda el contrato. */
export function pasarADisponible(
  context: VehicleDealerIdentity,
  vehicleId: string,
  idempotencyKey?: string,
): Promise<unknown> {
  return patchVehicle(context, vehicleId, { status: "disponible" }, idempotencyKey);
}

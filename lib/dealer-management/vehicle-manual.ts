/**
 * Alta manual de vehiculo (DASH-VEHICLE-MANUAL-CONTRACT-01).
 *
 * Solo ALTA. La edicion --PATCH material y transicion de `status`-- sale en su
 * propio packet: juntarlas pasaba el limite GR-12 de 500 lineas, y son dos vias
 * distintas del contrato.
 *
 * Solo se serializa lo que acepta `VehicleCreateRequest`. Lo que la ficha pide y
 * el backend no expone se declara PROXIMAMENTE y NO se envia: un extra inventado
 * no crea el dato, lo pierde en silencio.
 *
 * Los dos precios estan en ese grupo. Sus columnas --`price_amount`/
 * `price_currency` para el OFICIAL, `display_price_amount`/
 * `display_price_currency` para la referencia-- llegan con
 * VEHICLE-PRICE-PLATE-01 (backend #1511, P-A; plantilla_spec.py:168-172); hoy el
 * contrato aun los llama `price_rd`/`price_usd`, con la moneda en el nombre.
 *
 * Ninguna moneda de precio se escribe a mano: las dos entran por parametro desde
 * `legal_entities.functional_currency` y `display_price_currency`, y si faltan la
 * UI dice que falta el dato en vez de elegir una.
 *
 * El frontend NO concede: la clave 097 decide que se PINTA, la autoridad es HTTP.
 */

import { accessApiErrorFromHttp } from "@/lib/access/client";
import { apiFetch } from "@/lib/api/fetch-client";

/**
 * Dealer con el que se construye la peticion. La unidad organizativa puede
 * faltar --el dealer de Mapaal no tiene-- y entonces no se envia la cabecera:
 * la unidad la resuelve el backend, igual que en la lista del inventario.
 */
export type VehicleDealerIdentity = {
  tenantId: string;
  dealerId: string;
  organizationUnitId: string | null;
};

/** Clave 097 de escritura de inventario. */
export const VEHICLE_WRITE_CAPABILITY = "autos.inventory.create";

/** Estado inicial que fija el backend al crear: no se envia, se informa. */
export const VEHICLE_INITIAL_STATUS = "draft";

export const VEHICLE_STATUS_LABEL: Record<string, string> = {
  draft: "BORRADOR",
  disponible: "DISPONIBLE",
  reservado: "RESERVADO",
  vendido: "VENDIDO",
  archivado: "ARCHIVADO",
};

export const VEHICLE_CONDITIONS = [
  { value: "used", label: "Usado" },
  { value: "new", label: "Nuevo" },
] as const;

export type VehicleManualForm = {
  make: string;
  model: string;
  year: string;
  trim: string;
  vin: string;
  mileage_km: string;
  condition: string;
  fuel_type: string;
  transmission: string;
  drivetrain: string;
  body_type: string;
  exterior_color: string;
  interior_color: string;
  province: string;
  municipality: string;
  description: string;
};

export const VEHICLE_FORM_EMPTY: VehicleManualForm = {
  make: "",
  model: "",
  year: "",
  trim: "",
  vin: "",
  mileage_km: "",
  condition: "used",
  fuel_type: "",
  transmission: "",
  drivetrain: "",
  body_type: "",
  exterior_color: "",
  interior_color: "",
  province: "",
  municipality: "",
  description: "",
};

/** Campos que la ficha pide y el contrato publicado no expone todavia. */
export const VEHICLE_PENDING_FIELDS = [
  { name: "dominio", label: "Dominio" },
  { name: "stock_number", label: "Número de stock" },
  { name: "doors", label: "Puertas" },
  { name: "engine_displacement", label: "Cilindrada" },
  { name: "cylinders", label: "Cilindros" },
] as const;

export const PENDING_FIELD_NOTE = "Próximamente";

export type VehiclePriceField = { name: string; label: string; ayuda: string };

/** Etiqueta "(CODIGO)" solo si el backend aporto el codigo; nunca inventada. */
function conMoneda(base: string, currency: string | null, falta: string): string {
  const code = currency?.trim().toUpperCase();
  return code ? `${base} (${code})` : `${base} (${falta})`;
}

/**
 * Los dos precios. `functionalCurrency` es `legal_entities.functional_currency`
 * y `displayCurrency` es `display_price_currency`; sin codigo la etiqueta dice
 * que falta el dato. La referencia es informativa: no entra en el payload
 * contable ni altera el precio oficial.
 */
export function vehiclePriceFields(
  functionalCurrency: string | null,
  displayCurrency: string | null,
): VehiclePriceField[] {
  return [
    {
      name: "price_official",
      label: conMoneda("Precio", functionalCurrency, "moneda funcional del tenant"),
      ayuda: "Precio oficial. Obligatorio para pasar a DISPONIBLE; la contabilidad usa solo este.",
    },
    {
      name: "price_reference",
      label: conMoneda("Precio de referencia", displayCurrency, "moneda de referencia del tenant"),
      ayuda: "Solo se muestra en la publicación; la contabilidad usa el precio oficial.",
    },
  ];
}

const MAX_LENGTH: Partial<Record<keyof VehicleManualForm, number>> = {
  make: 50,
  model: 50,
  trim: 50,
  body_type: 30,
  fuel_type: 30,
  transmission: 30,
  drivetrain: 30,
  exterior_color: 30,
  interior_color: 30,
  province: 100,
  municipality: 100,
  description: 5000,
};

export type VehicleFormErrors = Partial<Record<keyof VehicleManualForm, string>>;

/** Mismos limites que el contrato. El 422 del backend sigue siendo la autoridad. */
export function validateVehicleForm(form: VehicleManualForm): VehicleFormErrors {
  const errors: VehicleFormErrors = {};
  if (!form.make.trim()) errors.make = "La marca es obligatoria.";
  if (!form.model.trim()) errors.model = "El modelo es obligatorio.";

  const yearText = form.year.trim();
  const year = Number(yearText);
  if (!yearText) errors.year = "El año es obligatorio.";
  else if (!Number.isInteger(year) || year < 1900 || year > 2050) {
    errors.year = "El año va de 1900 a 2050.";
  }

  const vin = form.vin.trim();
  if (vin && vin.length !== 17) errors.vin = "El VIN tiene exactamente 17 caracteres.";

  const km = form.mileage_km.trim();
  if (km) {
    const value = Number(km);
    if (!Number.isInteger(value) || value < 0 || value > 2_000_000) {
      errors.mileage_km = "Los kilómetros van de 0 a 2.000.000.";
    }
  }

  if (!VEHICLE_CONDITIONS.some((item) => item.value === form.condition)) {
    errors.condition = "Elegí una condición.";
  }

  for (const [name, limit] of Object.entries(MAX_LENGTH) as [keyof VehicleManualForm, number][]) {
    if (form[name].trim().length > limit) errors[name] = `Máximo ${limit} caracteres.`;
  }
  return errors;
}

function optionalText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

const OPTIONAL_TEXT_FIELDS = [
  "trim",
  "vin",
  "fuel_type",
  "transmission",
  "drivetrain",
  "body_type",
  "exterior_color",
  "interior_color",
  "province",
  "municipality",
  "description",
] as const;

/** Solo campos del contrato. Los opcionales vacios se omiten, no se envian null. */
export function vehicleCreatePayload(form: VehicleManualForm): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    make: form.make.trim(),
    model: form.model.trim(),
    year: Number(form.year.trim()),
    condition: form.condition,
  };
  for (const name of OPTIONAL_TEXT_FIELDS) {
    const value = optionalText(form[name]);
    if (value !== null) payload[name] = value;
  }
  const km = optionalText(form.mileage_km);
  if (km !== null) payload.mileage_km = Number(km);
  return payload;
}

export function vehicleIdFrom(body: unknown): string | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const rec = body as Record<string, unknown>;
  for (const key of ["id", "vehicle_id"]) {
    const value = rec[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

export async function createVehicleManual(
  context: VehicleDealerIdentity,
  form: VehicleManualForm,
  idempotencyKey?: string,
): Promise<unknown> {
  const tenant = encodeURIComponent(context.tenantId);
  const dealer = encodeURIComponent(context.dealerId);
  const path = `/api/v1/autos/tenants/${tenant}/dealers/${dealer}/vehicles`;
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Tenant-ID": context.tenantId,
    "X-Dealer-ID": context.dealerId,
  };
  if (context.organizationUnitId) headers["X-Organization-Unit-ID"] = context.organizationUnitId;
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  const response = await apiFetch(path, {
    method: "POST",
    headers,
    body: JSON.stringify(vehicleCreatePayload(form)),
  });
  let parsed: unknown = null;
  try {
    parsed = await response.json();
  } catch {
    parsed = null;
  }
  if (!response.ok) throw accessApiErrorFromHttp(response.status, parsed, path);
  return parsed;
}

/**
 * Alta y edicion manual de vehiculos (DASH-VEHICLE-MANUAL-01).
 *
 * El contrato publicado solo acepta los campos de `VehicleCreateRequest` y
 * `VehiclePatchRequest`. Todo campo que la ficha pide y el contrato no expone
 * se declara aqui como PROXIMAMENTE y NO se serializa: un extra inventado no
 * crea el dato, lo pierde en silencio y deja al usuario creyendo que lo guardo.
 *
 * Precio: el contrato sigue llamando `price_rd` / `price_usd`, con la moneda
 * incrustada en el nombre. Hasta que P-B renombre a moneda funcional, los dos
 * precios se pintan deshabilitados y este modulo nunca los envia.
 *
 * El frontend NO concede. La capability firmada del PATCH es
 * `inventory.vehicle.update` en el backend; aqui solo se pide la clave del
 * catalogo 097 para decidir que se PINTA, y la autoridad es la respuesta HTTP.
 */

import { accessApiErrorFromHttp } from "@/lib/access/client";
import { apiFetch } from "@/lib/api/fetch-client";
import type { DealerAccessContext } from "@/lib/dealer/access-context";

/** Clave 097 de escritura de inventario. No existe clave 097 de solo-edicion. */
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

/**
 * Los dos precios, con la moneda resuelta por el tenant y nunca escrita a mano.
 * `currency` llega de `localeDeTenant`; sin moneda el label dice que falta en
 * vez de inventar una.
 */
export function vehiclePriceFields(currency: string | null): {
  name: string;
  label: string;
  ayuda: string;
}[] {
  return [
    {
      name: "price_functional",
      label: currency ? `Precio (${currency})` : "Precio (moneda funcional del tenant)",
      ayuda: "Precio oficial. Obligatorio para pasar a DISPONIBLE; la contabilidad usa solo este.",
    },
    {
      name: "price_reference_usd",
      label: "Precio de referencia (US$)",
      ayuda: "Solo se muestra en la publicación; la contabilidad usa el precio en pesos.",
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

/** Campos materiales que el PATCH publicado acepta. El resto no es editable. */
export const VEHICLE_PATCHABLE_FIELDS = [
  "description",
  "mileage_km",
  "province",
  "municipality",
] as const;

export type VehiclePatchableField = (typeof VEHICLE_PATCHABLE_FIELDS)[number];

/**
 * PATCH material. `status` viaja por su propia via: el contrato prohibe
 * combinarlo con campos materiales bajo una sola Idempotency-Key.
 */
export function vehiclePatchPayload(form: VehicleManualForm): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const name of VEHICLE_PATCHABLE_FIELDS) {
    const value = optionalText(form[name]);
    if (value === null) continue;
    payload[name] = name === "mileage_km" ? Number(value) : value;
  }
  return payload;
}

export function vehicleStatusPayload(status: string): Record<string, unknown> {
  return { status };
}

/**
 * DISPONIBLE exige precio oficial. Mientras P-B no renombre el precio a moneda
 * funcional el formulario no puede capturarlo, asi que esta via queda cerrada y
 * se dice por que, en vez de ofrecer un boton que el backend va a rechazar.
 */
export function motivoBloqueoDisponible(precioOficial: number | null): string | null {
  if (precioOficial === null) return "FALTA_PRECIO_OFICIAL";
  if (!Number.isFinite(precioOficial) || precioOficial <= 0) return "PRECIO_NO_VALIDO";
  return null;
}

function writeUrl(context: DealerAccessContext, vehicleId?: string): string {
  const tenant = encodeURIComponent(context.tenantId);
  const dealer = encodeURIComponent(context.dealerId);
  const base = `/api/v1/autos/tenants/${tenant}/dealers/${dealer}/vehicles`;
  return vehicleId ? `${base}/${encodeURIComponent(vehicleId)}` : base;
}

async function writeJson(
  path: string,
  method: "POST" | "PATCH",
  context: DealerAccessContext,
  body: unknown,
  idempotencyKey?: string,
): Promise<unknown> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Tenant-ID": context.tenantId,
    "X-Dealer-ID": context.dealerId,
    "X-Organization-Unit-ID": context.organizationUnitId,
  };
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  const response = await apiFetch(path, { method, headers, body: JSON.stringify(body) });
  let parsed: unknown = null;
  try {
    parsed = await response.json();
  } catch {
    parsed = null;
  }
  if (!response.ok) throw accessApiErrorFromHttp(response.status, parsed, path);
  return parsed;
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
  context: DealerAccessContext,
  form: VehicleManualForm,
  idempotencyKey?: string,
): Promise<unknown> {
  return writeJson(writeUrl(context), "POST", context, vehicleCreatePayload(form), idempotencyKey);
}

export async function patchVehicleManual(
  context: DealerAccessContext,
  vehicleId: string,
  form: VehicleManualForm,
  idempotencyKey?: string,
): Promise<unknown> {
  return writeJson(
    writeUrl(context, vehicleId),
    "PATCH",
    context,
    vehiclePatchPayload(form),
    idempotencyKey,
  );
}

export async function patchVehicleStatus(
  context: DealerAccessContext,
  vehicleId: string,
  status: string,
  idempotencyKey?: string,
): Promise<unknown> {
  return writeJson(
    writeUrl(context, vehicleId),
    "PATCH",
    context,
    vehicleStatusPayload(status),
    idempotencyKey,
  );
}

/**
 * Alta manual de vehiculo (DASH-VEHICLE-MANUAL-CONTRACT-01, P2 del backend).
 *
 * Solo se serializa lo que acepta `VehicleCreateRequest` (backend #1545 y
 * #1564): el precio OFICIAL va como `price_amount` y la moneda NO se manda, la
 * pone el servidor con la funcional de la entidad legal del dealer. La
 * referencia (`display_price_amount` + `display_price_currency`), el dominio
 * (`plate` + `plate_country`) y `stock_number` van en pareja segun el contrato.
 *
 * Puertas, cilindrada y cilindros siguen PROXIMAMENTE: la base tiene columnas,
 * pero ni el alta ni la edicion las aceptan, y un extra que Pydantic ignora no
 * crea el dato, lo pierde en silencio.
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
  price_amount: string;
  display_price_amount: string;
  display_price_currency: string;
  plate: string;
  plate_country: string;
  stock_number: string;
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
  price_amount: "",
  display_price_amount: "",
  display_price_currency: "",
  plate: "",
  plate_country: "",
  stock_number: "",
};

/**
 * Campos que la ficha pide y el contrato publicado no expone todavia: hay
 * columna en la base, pero ni el POST ni el PATCH los aceptan.
 */
export const VEHICLE_PENDING_FIELDS = [
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
 * y `displayCurrency` es la `display_price_currency` que escribe el dealer; sin
 * codigo la etiqueta no elige ninguno. La referencia es informativa: no entra en el payload
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
      label: conMoneda("Precio de referencia", displayCurrency, "otra moneda"),
      ayuda: "Opcional y en otra moneda. Solo se muestra en la publicación; la contabilidad usa el precio oficial.",
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
  plate: 16,
  stock_number: 32,
};

export type VehicleFormErrors = Partial<Record<keyof VehicleManualForm, string>>;

/** Mismos limites que el contrato. El 422 del backend sigue siendo la autoridad. */
export function validateVehicleForm(
  form: VehicleManualForm,
  functionalCurrency: string | null = null,
): VehicleFormErrors {
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

  Object.assign(errors, validatePriceAndPlate(form, functionalCurrency));

  for (const [name, limit] of Object.entries(MAX_LENGTH) as [keyof VehicleManualForm, number][]) {
    if (form[name].trim().length > limit) errors[name] = `Máximo ${limit} caracteres.`;
  }
  return errors;
}

/**
 * Importe escrito por el dealer -> decimal con punto, o null si no es un
 * importe. Acepta "18500000,50", "18500000.50" y los miles con punto
 * ("18.500.000,50"); a lo sumo dos decimales. Viaja como string: es dinero y el
 * backend lo lee como Decimal.
 */
export function normalizaImporte(texto: string): string | null {
  const limpio = texto.trim().replace(/\s/g, "");
  let entero: string;
  let decimales = "";
  const miles = /^(\d{1,3}(?:\.\d{3})+)(?:,(\d{1,2}))?$/.exec(limpio);
  const simple = /^(\d+)(?:[.,](\d{1,2}))?$/.exec(limpio);
  if (miles) {
    entero = miles[1].replace(/\./g, "");
    decimales = miles[2] ?? "";
  } else if (simple) {
    entero = simple[1];
    decimales = simple[2] ?? "";
  } else {
    return null;
  }
  const valor = decimales ? `${entero}.${decimales}` : entero;
  return Number(valor) > 0 ? valor.replace(/^0+(?=\d)/, "") : null;
}

/** "es-AR" -> "AR". Sirve para proponer el pais del dominio, nunca para imponerlo. */
export function paisDeLocale(locale: string | null | undefined): string {
  const region = (locale ?? "").split(/[-_]/)[1] ?? "";
  return /^[A-Za-z]{2}$/.test(region) ? region.toUpperCase() : "";
}

const IMPORTE_INVALIDO = "Ingresá un importe mayor que cero, por ejemplo 18500000,50.";

/** Las reglas de pareja del contrato P2, con el mensaje junto a su campo. */
export function validatePriceAndPlate(form: VehicleManualForm, functionalCurrency: string | null): VehicleFormErrors {
  const errors: VehicleFormErrors = {};
  const precio = form.price_amount.trim();
  if (precio && normalizaImporte(precio) === null) errors.price_amount = IMPORTE_INVALIDO;

  const refImporte = form.display_price_amount.trim();
  const refMoneda = form.display_price_currency.trim().toUpperCase();
  if (refImporte || refMoneda) {
    if (!refImporte) errors.display_price_amount = "Falta el importe de la referencia (o borrá su moneda).";
    else if (normalizaImporte(refImporte) === null) errors.display_price_amount = IMPORTE_INVALIDO;
    else if (!precio) errors.display_price_amount = "Para cargar una referencia primero cargá el precio.";
    if (!refMoneda) errors.display_price_currency = "Falta la moneda de la referencia (o borrá su importe).";
    else if (!/^[A-Z]{3}$/.test(refMoneda)) {
      errors.display_price_currency = "La moneda va con su código de 3 letras, por ejemplo USD.";
    } else if (functionalCurrency && refMoneda === functionalCurrency.trim().toUpperCase()) {
      errors.display_price_currency = `La referencia tiene que estar en otra moneda que el precio (${refMoneda}).`;
    }
  }

  if (form.plate.trim()) {
    const pais = form.plate_country.trim();
    if (!pais) errors.plate_country = "Indicá el país del dominio.";
    else if (!/^[A-Za-z]{2}$/.test(pais)) errors.plate_country = "El país va con su código de 2 letras, por ejemplo AR.";
  }
  return errors;
}

/**
 * Motivo estable del backend (P2) -> el campo donde se corrige y que decir.
 * Lo que no esta aqui se pinta como error general del formulario.
 */
export const MOTIVO_EN_CAMPO: Record<string, { campo: keyof VehicleManualForm; mensaje: string }> = {
  PRICE_NOT_POSITIVE: { campo: "price_amount", mensaje: "El precio tiene que ser mayor que cero." },
  PRICE_REQUIRED_FOR_DISPONIBLE: { campo: "price_amount", mensaje: "Cargá el precio antes de pasar a DISPONIBLE." },
  PRICE_CURRENCY_NOT_FUNCTIONAL: {
    campo: "price_amount",
    mensaje: "El precio no está en la moneda oficial de tu concesionario.",
  },
  FUNCTIONAL_CURRENCY_NOT_CONFIGURED: {
    campo: "price_amount",
    mensaje: "Tu cuenta todavía no tiene moneda oficial configurada. Pedila a soporte antes de cargar precios.",
  },
  DISPLAY_PRICE_PAIR: { campo: "display_price_amount", mensaje: "Completá importe y moneda de la referencia, o ninguno." },
  DISPLAY_PRICE_WITHOUT_PRICE: { campo: "display_price_amount", mensaje: "Para cargar una referencia primero cargá el precio." },
  DISPLAY_PRICE_NOT_POSITIVE: { campo: "display_price_amount", mensaje: "La referencia tiene que ser mayor que cero." },
  DISPLAY_PRICE_SAME_CURRENCY: {
    campo: "display_price_currency",
    mensaje: "La referencia tiene que estar en otra moneda que el precio.",
  },
  DISPLAY_PRICE_CURRENCY_INVALID: { campo: "display_price_currency", mensaje: "Esa moneda no es válida." },
  PLATE_PAIR: { campo: "plate", mensaje: "Completá dominio y país, o ninguno." },
  PLATE_COUNTRY_INVALID: { campo: "plate_country", mensaje: "Ese país no es válido para el dominio." },
  STOCK_NUMBER_TAKEN: { campo: "stock_number", mensaje: "Ese número de stock ya lo tiene otro vehículo." },
};

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
  Object.assign(payload, priceAndPlatePayload(form));
  return payload;
}

/**
 * Precio, referencia, dominio y stock, como los pide el contrato. Comun al alta
 * y a la edicion. La moneda del precio oficial NUNCA viaja. El pais del dominio
 * sin dominio no se manda: es una propuesta del formulario, no un dato.
 */
export function priceAndPlatePayload(form: VehicleManualForm): Record<string, string> {
  const payload: Record<string, string> = {};
  const precio = normalizaImporte(form.price_amount);
  if (precio !== null) payload.price_amount = precio;
  const referencia = normalizaImporte(form.display_price_amount);
  const moneda = optionalText(form.display_price_currency);
  if (referencia !== null && moneda !== null) {
    payload.display_price_amount = referencia;
    payload.display_price_currency = moneda.toUpperCase();
  }
  const plate = optionalText(form.plate);
  const pais = optionalText(form.plate_country);
  if (plate !== null && pais !== null) {
    payload.plate = plate.toUpperCase();
    payload.plate_country = pais.toUpperCase();
  }
  const stock = optionalText(form.stock_number);
  if (stock !== null) payload.stock_number = stock;
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

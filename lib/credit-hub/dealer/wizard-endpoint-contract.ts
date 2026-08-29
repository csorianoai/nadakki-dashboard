export const APPLICANT_ENDPOINT_FIELDS = [
  "name", "national_id", "nombre_completo", "cedula", "fecha_nacimiento", "estado_civil",
  "telefono_celular", "email", "direccion", "municipio", "provincia", "tipo_empleo",
  "nombre_empleador", "cargo", "ingreso_mensual_declarado", "monto_solicitado", "plazo_meses",
  "inicial_disponible", "referencias",
] as const;

export const VEHICLE_ENDPOINT_FIELDS = [
  "vin", "make", "model", "version", "year", "color", "condicion", "km_odometro",
  "vehicle_value", "loan_amount_requested",
] as const;

export const EDITABLE_ENDPOINT_FIELDS = [
  "telefono_celular", "telefono_trabajo", "email", "direccion", "sector", "municipio",
  "provincia", "nombre_empleador", "antiguedad_empleo_meses", "cargo",
  "ingreso_mensual_declarado", "otros_ingresos", "inicial_disponible", "plazo_meses",
  "referencias_personales",
] as const;

export const WIZARD_STEP_ENDPOINT_FIELDS = {
  applicant: APPLICANT_ENDPOINT_FIELDS,
  vehicle: VEHICLE_ENDPOINT_FIELDS,
  editable: EDITABLE_ENDPOINT_FIELDS,
} as const;

export function unknownWizardEndpointFields(
  endpoint: keyof typeof WIZARD_STEP_ENDPOINT_FIELDS,
  fields: readonly string[],
): string[] {
  const accepted: Set<string> = new Set(WIZARD_STEP_ENDPOINT_FIELDS[endpoint]);
  return fields.filter((field) => !accepted.has(field));
}

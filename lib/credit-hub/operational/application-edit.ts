/** Application field edit whitelist — contract-first (OPERATIONAL_UI_LOOP F1). */

export const EDITABLE_APPLICATION_FIELD_KEYS = [
  "applicant_phone",
  "applicant_email",
  "applicant_address",
  "applicant_sector",
  "applicant_city",
  "applicant_province",
  "employer_name",
  "employment_tenure_months",
  "employment_position",
  "monthly_income",
  "other_income",
  "down_payment",
  "desired_term_months",
  "personal_references",
] as const;

export type EditableApplicationFieldKey = (typeof EDITABLE_APPLICATION_FIELD_KEYS)[number];

export const LOCKED_APPLICATION_FIELD_KEYS = [
  "applicant_identification",
  "applicant_full_name",
  "applicant_date_of_birth",
  "vehicle_vin",
  "vehicle_plate",
  "vehicle_sale_price",
  "vehicle_appraisal_value",
] as const;

export const APPLICATION_FIELD_LABELS: Record<string, string> = {
  applicant_phone: "Teléfono",
  applicant_email: "Correo electrónico",
  applicant_address: "Dirección",
  applicant_sector: "Sector",
  applicant_city: "Municipio",
  applicant_province: "Provincia",
  employer_name: "Empleador",
  employment_tenure_months: "Antigüedad laboral",
  employment_position: "Cargo",
  monthly_income: "Ingreso mensual",
  other_income: "Otros ingresos",
  down_payment: "Inicial disponible",
  desired_term_months: "Plazo preferido",
  personal_references: "Referencias personales",
  applicant_identification: "Cédula",
  applicant_full_name: "Nombre",
  applicant_date_of_birth: "Fecha de nacimiento",
  vehicle_vin: "VIN",
  vehicle_plate: "Placa",
  vehicle_sale_price: "Precio de venta",
  vehicle_appraisal_value: "Valor de tasación",
};

const EDITABLE_DISPLAY_STATUSES = new Set(["DRAFT", "SENT_TO_BANKS"]);

/** Infer editability from server display_status when backend editability endpoint is absent. */
export function isApplicationEditable(displayStatus: string | null | undefined): boolean {
  const key = (displayStatus ?? "").trim().toUpperCase();
  if (!key) return false;
  return EDITABLE_DISPLAY_STATUSES.has(key);
}

export function fieldLabel(fieldKey: string): string {
  return APPLICATION_FIELD_LABELS[fieldKey] ?? fieldKey.replace(/_/g, " ");
}

export function isEditableFieldKey(key: string): key is EditableApplicationFieldKey {
  return (EDITABLE_APPLICATION_FIELD_KEYS as readonly string[]).includes(key);
}

export interface ApplicationEditFormValues {
  applicant_phone: string;
  applicant_email: string;
  applicant_address: string;
  applicant_sector: string;
  applicant_city: string;
  applicant_province: string;
  employer_name: string;
  employment_tenure_months: string;
  employment_position: string;
  monthly_income: string;
  other_income: string;
  down_payment: string;
  desired_term_months: string;
  personal_references_json: string;
}

export function extractEditFormFromRaw(raw: unknown): ApplicationEditFormValues {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const payload = (o.application_payload && typeof o.application_payload === "object" ? o.application_payload : o) as Record<
    string,
    unknown
  >;
  const applicant = (payload.applicant && typeof payload.applicant === "object" ? payload.applicant : {}) as Record<
    string,
    unknown
  >;
  const employment = (payload.employment && typeof payload.employment === "object" ? payload.employment : {}) as Record<
    string,
    unknown
  >;
  const financial = (payload.financial && typeof payload.financial === "object" ? payload.financial : {}) as Record<
    string,
    unknown
  >;
  const refs = payload.referencias_personales ?? payload.personal_references;
  return {
    applicant_phone: String(applicant.phone ?? applicant.applicant_phone ?? o.applicant_phone ?? ""),
    applicant_email: String(applicant.email ?? applicant.applicant_email ?? o.applicant_email ?? ""),
    applicant_address: String(applicant.address ?? applicant.applicant_address ?? ""),
    applicant_sector: String(applicant.sector ?? applicant.applicant_sector ?? ""),
    applicant_city: String(applicant.city ?? applicant.applicant_city ?? ""),
    applicant_province: String(applicant.province ?? applicant.applicant_province ?? ""),
    employer_name: String(employment.employer_name ?? employment.employer ?? ""),
    employment_tenure_months: String(employment.tenure_months ?? employment.employment_tenure_months ?? ""),
    employment_position: String(employment.position ?? employment.employment_position ?? ""),
    monthly_income: String(employment.monthly_income ?? financial.monthly_income ?? o.monthly_income ?? ""),
    other_income: String(employment.other_income ?? financial.other_income ?? ""),
    down_payment: String(financial.down_payment ?? o.down_payment ?? ""),
    desired_term_months: String(financial.term_months ?? financial.desired_term_months ?? ""),
    personal_references_json: refs ? JSON.stringify(refs, null, 2) : "[]",
  };
}

export function buildFieldsPatch(before: ApplicationEditFormValues, after: ApplicationEditFormValues): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  for (const key of EDITABLE_APPLICATION_FIELD_KEYS) {
    const prev = key === "personal_references" ? before.personal_references_json : before[key];
    const next = key === "personal_references" ? after.personal_references_json : after[key];
    if (String(prev).trim() === String(next).trim()) continue;
    if (key === "personal_references") {
      try {
        patch[key] = JSON.parse(after.personal_references_json);
      } catch {
        patch[key] = after.personal_references_json;
      }
    } else {
      patch[key] = next;
    }
  }
  return patch;
}

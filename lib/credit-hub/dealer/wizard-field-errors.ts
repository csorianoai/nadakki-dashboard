import type { ApplicationFormData, WizardStepValidationConfig } from "@/components/credit-hub/dealer/wizard/WizardContainer";
import {
  getGaranteInlineErrors,
  tenantDocumentKey,
} from "@/components/credit-hub/dealer/wizard/WizardContainer";
import type { CreditHubTranslations } from "@/lib/credit-hub/i18n/locales/es-DO/credit-hub";
import { cleanDominicanCedula } from "@/lib/credit/formatters/dominican-id";
import { validateDominicanCedula, validatePassport } from "@/lib/credit/validators/dominican-id";
import { calculateAge, parseDateInput } from "@/lib/credit/utils/age";
import {
  hasRequiredDocumentsFileReady,
  isPersonalReferenceComplete,
  isPersonalReferencePhoneValid,
  missingRequiredDocumentLabels,
  PERSONAL_REFERENCES_MIN,
  personalReferencePhoneDigitCount,
  type PersonalReferenceFormRow,
} from "@/lib/credit-hub/dealer/wizard-gates";
import {
  vehicleDeclarationComplete,
  vehicleDeclarationQuestionsAnswered,
} from "@/lib/credit-hub/dealer/vehicle-declaration";

export const WIZARD_ERROR_REQUIRED = "Este campo es obligatorio";
export const WIZARD_ERROR_INVALID_CEDULA = "Número de cédula inválido";
export const WIZARD_ERROR_PHONE_MIN = "Mínimo 7 dígitos";

export type WizardFieldErrors = Record<string, string>;

export interface WizardValidationResult {
  errors: WizardFieldErrors;
  summaries: string[];
}

function isFilled(value: string | undefined | null): boolean {
  return Boolean(value && String(value).trim());
}

function numeric(value: string | number | null | undefined): number {
  const parsed = Number(String(value ?? "0").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function documentIsValid(type: string, value: string): boolean {
  if (type === "CEDULA") return validateDominicanCedula(value);
  if (type === "PASAPORTE") return validatePassport(value);
  return isFilled(value);
}

function ageFromInput(value: string): number | null {
  const date = parseDateInput(value);
  return date ? calculateAge(date) : null;
}

function setRequired(
  errors: WizardFieldErrors,
  summaries: string[],
  field: string,
  value: string | undefined | null,
  section: string,
  label: string,
): void {
  if (isFilled(value)) return;
  errors[field] = WIZARD_ERROR_REQUIRED;
  summaries.push(`${section}: falta ${label}`);
}

function setPhone(
  errors: WizardFieldErrors,
  summaries: string[],
  field: string,
  value: string,
  section: string,
  label: string,
): void {
  if (!isFilled(value)) {
    errors[field] = WIZARD_ERROR_REQUIRED;
    summaries.push(`${section}: falta ${label}`);
    return;
  }
  if (personalReferencePhoneDigitCount(value) < 7) {
    errors[field] = WIZARD_ERROR_PHONE_MIN;
    summaries.push(`${section}: ${label} — mínimo 7 dígitos`);
  }
}

function setDocumentId(
  errors: WizardFieldErrors,
  summaries: string[],
  field: string,
  docType: string,
  value: string,
  section: string,
  label: string,
): void {
  if (!isFilled(value)) {
    errors[field] = WIZARD_ERROR_REQUIRED;
    summaries.push(`${section}: falta ${label}`);
    return;
  }
  if (!documentIsValid(docType, value)) {
    errors[field] = docType === "CEDULA" ? WIZARD_ERROR_INVALID_CEDULA : "Pasaporte inválido";
    summaries.push(`${section}: ${label} inválido`);
  }
}

function applicantStepErrors(
  data: ApplicationFormData,
  config: WizardStepValidationConfig,
): WizardValidationResult {
  const errors: WizardFieldErrors = {};
  const summaries: string[] = [];
  const section = "Sección Solicitante";
  const applicantDoc = data.applicant_document_type || config.default_document_type;

  setRequired(errors, summaries, "applicant_full_name", data.applicant_full_name, section, "nombre completo");
  setDocumentId(errors, summaries, "applicant_identification", applicantDoc, data.applicant_identification, section, "número de documento");
  setRequired(errors, summaries, "applicant_date_of_birth", data.applicant_date_of_birth, section, "fecha de nacimiento");
  setRequired(errors, summaries, "applicant_marital_status", data.applicant_marital_status, section, "estado civil");
  setPhone(errors, summaries, "applicant_phone", data.applicant_phone, section, "teléfono");
  setRequired(errors, summaries, "applicant_email", data.applicant_email, section, "correo electrónico");
  setRequired(errors, summaries, "applicant_address", data.applicant_address, section, "dirección");
  setRequired(errors, summaries, "applicant_city", data.applicant_city, section, "municipio");
  setRequired(errors, summaries, "applicant_province", data.applicant_province, section, "provincia");
  setRequired(errors, summaries, "applicant_country", data.applicant_country, section, "país");

  if (applicantDoc === "OTRO" && !isFilled(data.applicant_document_other_type)) {
    errors.applicant_document_other_type = WIZARD_ERROR_REQUIRED;
    summaries.push(`${section}: falta especificar tipo de documento`);
  }

  const age = ageFromInput(data.applicant_date_of_birth);
  if (data.applicant_date_of_birth && age !== null && age < config.min_age) {
    errors.applicant_date_of_birth = `Edad mínima requerida: ${config.min_age} años`;
    summaries.push(`${section}: edad mínima ${config.min_age} años`);
  }
  if (data.applicant_date_of_birth && age !== null && age > config.max_age) {
    errors.applicant_date_of_birth = "Edad excede el rango operativo del producto";
    summaries.push(`${section}: edad excede el máximo permitido`);
  }

  return { errors, summaries };
}

function employmentStepErrors(data: ApplicationFormData): WizardValidationResult {
  const errors: WizardFieldErrors = {};
  const summaries: string[] = [];
  const section = "Sección Empleo";

  setRequired(errors, summaries, "employment_type", data.employment_type, section, "tipo de empleo");
  setRequired(errors, summaries, "employer_name", data.employer_name, section, "empresa");
  setRequired(errors, summaries, "employment_position", data.employment_position, section, "cargo");
  setRequired(errors, summaries, "employment_start_date", data.employment_start_date, section, "fecha de ingreso");
  setRequired(errors, summaries, "monthly_income", data.monthly_income, section, "ingreso mensual");
  setPhone(errors, summaries, "work_phone", data.work_phone, section, "teléfono empresa");
  setRequired(errors, summaries, "employer_address", data.employer_address, section, "dirección empresa");
  setRequired(errors, summaries, "employer_province", data.employer_province, section, "provincia empresa");
  setRequired(errors, summaries, "employer_city", data.employer_city, section, "municipio empresa");
  setRequired(errors, summaries, "contract_type", data.contract_type, section, "tipo de contrato");

  if (data.has_other_income === "yes") {
    if (data.other_incomes.length < 1) {
      errors.other_incomes = WIZARD_ERROR_REQUIRED;
      summaries.push(`${section}: falta al menos una fuente de ingreso adicional`);
    }
    data.other_incomes.forEach((row, index) => {
      const rowSection = `${section} (ingreso adicional ${index + 1})`;
      if (!isFilled(row.concept)) {
        errors[`other_income_${row.id}_concept`] = WIZARD_ERROR_REQUIRED;
        summaries.push(`${rowSection}: falta concepto`);
      }
      if (!isFilled(row.amount) || numeric(row.amount) <= 0) {
        errors[`other_income_${row.id}_amount`] = WIZARD_ERROR_REQUIRED;
        summaries.push(`${rowSection}: falta monto`);
      }
      if (!row.frequency) {
        errors[`other_income_${row.id}_frequency`] = WIZARD_ERROR_REQUIRED;
        summaries.push(`${rowSection}: falta frecuencia`);
      }
      if (row.frequency === "VARIABLE" && !isFilled(row.variable_avg_6_months ?? "")) {
        errors[`other_income_${row.id}_variable_avg_6_months`] = WIZARD_ERROR_REQUIRED;
        summaries.push(`${rowSection}: falta promedio 6 meses`);
      }
    });
  }

  return { errors, summaries };
}

function vehicleStepErrors(data: ApplicationFormData): WizardValidationResult {
  const errors: WizardFieldErrors = {};
  const summaries: string[] = [];
  const section = "Sección Vehículo";

  setRequired(errors, summaries, "product_type", data.product_type, section, "tipo de producto");
  setRequired(errors, summaries, "vehicle_make", data.vehicle_make, section, "marca");
  if (data.vehicle_make === "Otros" && !isFilled(data.vehicle_brand_other)) {
    errors.vehicle_brand_other = WIZARD_ERROR_REQUIRED;
    summaries.push(`${section}: falta especificar marca`);
  }
  setRequired(errors, summaries, "vehicle_model", data.vehicle_model, section, "modelo");
  setRequired(errors, summaries, "vehicle_year", data.vehicle_year, section, "año");
  setRequired(errors, summaries, "vehicle_price", data.vehicle_price, section, "precio de venta");
  setRequired(errors, summaries, "dealer_supplier", data.dealer_supplier, section, "dealer / suplidor");
  setRequired(errors, summaries, "vehicle_condition", data.vehicle_condition, section, "condición");
  setRequired(errors, summaries, "desired_term", data.desired_term, section, "plazo deseado");
  setRequired(errors, summaries, "down_payment", data.down_payment, section, "cuota inicial");
  setRequired(errors, summaries, "monthly_debts", data.monthly_debts, section, "deudas mensuales");
  setRequired(errors, summaries, "has_bank_account", data.has_bank_account, section, "cuenta bancaria");

  if (!vehicleDeclarationQuestionsAnswered(data)) {
    const declFields: Array<{ key: keyof ApplicationFormData; label: string }> = [
      { key: "vehicle_decl_perdida_total", label: "pérdida total" },
      { key: "vehicle_decl_accidentes", label: "accidentes" },
      { key: "vehicle_decl_gravamenes", label: "gravámenes" },
      { key: "vehicle_decl_titulo_vendedor", label: "título vendedor" },
      { key: "vehicle_decl_km_coincide", label: "kilometraje" },
    ];
    for (const { key, label } of declFields) {
      if (!isFilled(String(data[key] ?? ""))) {
        errors[key] = WIZARD_ERROR_REQUIRED;
        summaries.push(`Declaración vehículo: falta ${label}`);
      }
    }
  }
  if (!isFilled(data.vehicle_decl_signature_name) || data.vehicle_decl_signature_name.trim().length < 3) {
    errors.vehicle_decl_signature_name = WIZARD_ERROR_REQUIRED;
    summaries.push("Declaración vehículo: falta firma del dealer");
  }

  if (!vehicleDeclarationComplete(data) && summaries.length === 0) {
    summaries.push("Declaración vehículo incompleta");
  }

  return { errors, summaries };
}

function coBorrowerStepErrors(
  data: ApplicationFormData,
  config: WizardStepValidationConfig,
  t: CreditHubTranslations,
): WizardValidationResult {
  if (data.co_debtor_required !== "yes" && !config.garante_required) {
    return { errors: {}, summaries: [] };
  }

  const errors: WizardFieldErrors = {};
  const summaries: string[] = [];
  const section = "Sección Co-firmante";
  const coDoc = data.co_debtor_document_type || config.default_document_type;

  setRequired(errors, summaries, "co_debtor_full_name", data.co_debtor_full_name, section, "nombre completo");
  setDocumentId(errors, summaries, "co_debtor_identification", coDoc, data.co_debtor_identification, section, "número de documento");
  setRequired(errors, summaries, "co_debtor_date_of_birth", data.co_debtor_date_of_birth, section, "fecha de nacimiento");
  setPhone(errors, summaries, "co_debtor_phone", data.co_debtor_phone, section, "teléfono");
  setRequired(errors, summaries, "co_debtor_email", data.co_debtor_email, section, "correo electrónico");
  setRequired(errors, summaries, "co_debtor_address", data.co_debtor_address, section, "dirección");
  setRequired(errors, summaries, "co_debtor_province", data.co_debtor_province, section, "provincia");
  setRequired(errors, summaries, "co_debtor_city", data.co_debtor_city, section, "municipio");
  setRequired(errors, summaries, "co_debtor_monthly_income", data.co_debtor_monthly_income, section, "ingreso mensual");
  setRequired(errors, summaries, "co_debtor_relationship", data.co_debtor_relationship, section, "relación");
  setRequired(errors, summaries, "co_debtor_employer_name", data.co_debtor_employer_name, section, "empresa");
  setRequired(errors, summaries, "co_debtor_employment_start_date", data.co_debtor_employment_start_date, section, "fecha de ingreso");

  if (coDoc === "OTRO" && !isFilled(data.co_debtor_document_other_type)) {
    errors.co_debtor_document_other_type = WIZARD_ERROR_REQUIRED;
    summaries.push(`${section}: falta especificar tipo de documento`);
  }

  const coAge = ageFromInput(data.co_debtor_date_of_birth);
  if (data.co_debtor_date_of_birth && coAge !== null && coAge < config.min_age) {
    errors.co_debtor_date_of_birth = `Edad mínima requerida: ${config.min_age} años`;
    summaries.push(`${section}: edad mínima ${config.min_age} años`);
  }

  const sameCedula =
    (data.applicant_document_type || config.default_document_type) === "CEDULA" &&
    coDoc === "CEDULA" &&
    cleanDominicanCedula(data.applicant_identification) &&
    cleanDominicanCedula(data.applicant_identification) === cleanDominicanCedula(data.co_debtor_identification);
  if (sameCedula) {
    errors.co_debtor_identification = t.validation.cedula_match_applicant;
    summaries.push(`${section}: cédula igual al solicitante`);
  }

  if (isFilled(data.co_debtor_monthly_income) && Number(data.co_debtor_monthly_income) <= 0) {
    errors.co_debtor_monthly_income = t.validation.guarantor_income_positive;
    summaries.push(`${section}: ingreso mensual inválido`);
  }

  if (data.co_debtor_relationship === "Otro" && !isFilled(data.co_debtor_relationship_other ?? "")) {
    errors.co_debtor_relationship_other = t.validation.relationship_other_required;
    summaries.push(`${section}: falta especificar relación`);
  }

  const garanteInline = getGaranteInlineErrors(data, config, t.validation);
  for (const [key, message] of Object.entries(garanteInline)) {
    if (!errors[key]) errors[key] = message;
  }

  return { errors, summaries };
}

function personalReferenceFieldErrors(ref: PersonalReferenceFormRow, index: number): WizardFieldErrors {
  const errors: WizardFieldErrors = {};
  const cardKey = `personal_reference_${index}`;
  if (!isFilled(ref.nombre_completo)) errors[`${cardKey}_nombre_completo`] = WIZARD_ERROR_REQUIRED;
  if (!isFilled(ref.direccion)) errors[`${cardKey}_direccion`] = WIZARD_ERROR_REQUIRED;
  if (!isFilled(ref.telefono)) {
    errors[`${cardKey}_telefono`] = WIZARD_ERROR_REQUIRED;
  } else if (!isPersonalReferencePhoneValid(ref.telefono)) {
    errors[`${cardKey}_telefono`] = WIZARD_ERROR_PHONE_MIN;
  }
  if (!isPersonalReferenceComplete(ref)) errors[cardKey] = "Referencia incompleta";
  return errors;
}

function personalReferenceSummaries(refs: PersonalReferenceFormRow[]): string[] {
  const summaries: string[] = [];
  refs.forEach((ref, index) => {
    const refLabel = `Referencia ${index + 1}`;
    if (!isFilled(ref.nombre_completo)) summaries.push(`${refLabel}: falta nombre`);
    else if (!isFilled(ref.direccion)) summaries.push(`${refLabel}: falta dirección`);
    else if (!isFilled(ref.telefono)) summaries.push(`${refLabel}: falta teléfono`);
    else if (!isPersonalReferencePhoneValid(ref.telefono)) summaries.push(`${refLabel}: teléfono — mínimo 7 dígitos`);
  });
  const completeCount = refs.filter(isPersonalReferenceComplete).length;
  if (completeCount < PERSONAL_REFERENCES_MIN) {
    summaries.push(`Se requieren ${PERSONAL_REFERENCES_MIN} referencias completas (tienes ${completeCount})`);
  }
  return summaries;
}

function documentsStepErrors(
  data: ApplicationFormData,
  config: WizardStepValidationConfig,
): WizardValidationResult {
  const errors: WizardFieldErrors = {};
  const summaries: string[] = [];
  const forgeDocMode = Object.keys(data.document_files_ready ?? {}).length > 0;

  if (forgeDocMode) {
    const missingDocs = missingRequiredDocumentLabels(data, config.required_documents, tenantDocumentKey);
    for (const label of missingDocs) {
      const doc = config.required_documents.find((d) => d.label === label);
      const key = doc ? tenantDocumentKey(doc) : label;
      errors[`document_${key}`] = "Documento obligatorio pendiente";
      summaries.push(`Documento: falta ${label}`);
    }
  } else {
    const requiredDocs = config.required_documents.filter((d) => d.required);
    for (const doc of requiredDocs) {
      const key = tenantDocumentKey(doc);
      if (!data.documents_received[key]) {
        errors[`document_${key}`] = WIZARD_ERROR_REQUIRED;
        summaries.push(`Documento: falta ${doc.label}`);
      }
    }
  }

  const refs = data.personal_references ?? [];
  refs.forEach((ref, index) => {
    Object.assign(errors, personalReferenceFieldErrors(ref, index));
  });
  summaries.push(...personalReferenceSummaries(refs));

  return { errors, summaries: [...new Set(summaries)] };
}

function consentStepErrors(
  data: ApplicationFormData,
  config: WizardStepValidationConfig,
): WizardValidationResult {
  const errors: WizardFieldErrors = {};
  const summaries: string[] = [];
  const section = "Sección Consentimiento";

  if (!data.consent_bureau_authorization) {
    errors.consent_bureau_authorization = WIZARD_ERROR_REQUIRED;
    summaries.push(`${section}: falta autorización de buró`);
  }
  if (!data.consent_terms_accepted) {
    errors.consent_terms_accepted = WIZARD_ERROR_REQUIRED;
    summaries.push(`${section}: falta aceptación de términos`);
  }
  if (!data.consent_data_processing_authorization) {
    errors.consent_data_processing_authorization = WIZARD_ERROR_REQUIRED;
    summaries.push(`${section}: falta autorización de datos`);
  }

  if (data.consent_presence === "present") {
    if (data.consent_signature_full_name.trim().length < 3) {
      errors.consent_signature_full_name = WIZARD_ERROR_REQUIRED;
      summaries.push(`${section}: falta firma`);
    }
    if (!data.consent_present_confirmed) {
      errors.consent_present_confirmed = WIZARD_ERROR_REQUIRED;
      summaries.push(`${section}: falta confirmar presencia`);
    }
  } else if (!config.consent_application_id_ready) {
    errors.consent_method = WIZARD_ERROR_REQUIRED;
    summaries.push(`${section}: falta ID de solicitud para consentimiento remoto`);
  } else {
    const method = data.consent_method;
    if (!method) {
      errors.consent_method = WIZARD_ERROR_REQUIRED;
      summaries.push(`${section}: falta método de consentimiento`);
    } else if (method === "SMS_OTP") {
      if (!data.consent_sms_otp_sent) {
        errors.consent_sms_otp_sent = WIZARD_ERROR_REQUIRED;
        summaries.push(`${section}: falta enviar código SMS`);
      }
      if (data.consent_dealer_otp_code.trim().length !== 6) {
        errors.consent_dealer_otp_code = WIZARD_ERROR_REQUIRED;
        summaries.push(`${section}: falta código OTP de 6 dígitos`);
      }
      if (!data.consent_accepted_at.trim()) {
        errors.consent_accepted_at = WIZARD_ERROR_REQUIRED;
        summaries.push(`${section}: falta confirmar OTP`);
      }
    } else if (method === "WHATSAPP" || method === "EMAIL" || method === "SELFIE") {
      if (!data.consent_accepted_at.trim()) {
        errors.consent_accepted_at = WIZARD_ERROR_REQUIRED;
        summaries.push(`${section}: falta confirmar consentimiento remoto`);
      }
    }
  }

  return { errors, summaries };
}

/** Forge wizard segment index (0–4) → field-level validation. */
export function getWizardSegmentValidation(
  segmentIndex: number,
  data: ApplicationFormData,
  config: WizardStepValidationConfig,
  t: CreditHubTranslations,
): WizardValidationResult {
  if (segmentIndex === 0) {
    const applicant = applicantStepErrors(data, config);
    const employment = employmentStepErrors(data);
    return {
      errors: { ...applicant.errors, ...employment.errors },
      summaries: [...applicant.summaries, ...employment.summaries],
    };
  }
  if (segmentIndex === 1) return coBorrowerStepErrors(data, config, t);
  if (segmentIndex === 2) return vehicleStepErrors(data);
  if (segmentIndex === 3) return documentsStepErrors(data, config);
  if (segmentIndex === 4) return consentStepErrors(data, config);
  return { errors: {}, summaries: [] };
}

export function wizardBlockReasonMessage(summaries: string[]): string | null {
  if (summaries.length === 0) return null;
  return summaries.slice(0, 3).join(" · ");
}

export function scrollToFirstWizardError(errors: WizardFieldErrors): void {
  const keys = Object.keys(errors);
  if (keys.length === 0) return;
  const ordered = keys.sort((a, b) => {
    const elA = document.querySelector(`[data-wizard-field="${a}"]`);
    const elB = document.querySelector(`[data-wizard-field="${b}"]`);
    if (!elA || !elB) return 0;
    const rectA = elA.getBoundingClientRect();
    const rectB = elB.getBoundingClientRect();
    return rectA.top - rectB.top;
  });
  for (const key of ordered) {
    const el = document.querySelector(`[data-wizard-field="${key}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      const focusable = el.querySelector<HTMLElement>("input, select, textarea, button");
      focusable?.focus({ preventScroll: true });
      return;
    }
  }
}

/** Debug helper: log reference validation state on documents step. */
export function logPersonalReferencesDebug(refs: PersonalReferenceFormRow[]): void {
  console.info("[wizard-validation] personal_references", refs.map((ref, index) => ({
    index: index + 1,
    nombre_completo: ref.nombre_completo,
    direccion: ref.direccion,
    telefono: ref.telefono,
    digitCount: personalReferencePhoneDigitCount(ref.telefono),
    complete: isPersonalReferenceComplete(ref),
    errors: personalReferenceFieldErrors(ref, index),
  })));
}

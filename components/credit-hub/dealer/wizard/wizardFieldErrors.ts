import type { CreditHubTranslations } from "@/lib/credit-hub/i18n/locales/es-DO/credit-hub";
import { cleanDominicanCedula } from "@/lib/credit/formatters/dominican-id";
import {
  ageFromInput,
  documentIsValid,
  getGaranteInlineErrors,
  isFilled,
  numeric,
  tenantDocumentKey,
  type ApplicationFormData,
  type WizardStepValidationConfig,
} from "./WizardContainer";

/**
 * Returns a Record<string, string> mapping field names to error messages
 * for the given internal wizard step. Mirrors `stepIsValid()` logic but
 * returns granular per-field errors instead of a boolean.
 */
export function getStepFieldErrors(
  step: number,
  data: ApplicationFormData,
  config: WizardStepValidationConfig,
  t: CreditHubTranslations
): Record<string, string> {
  const errors: Record<string, string> = {};
  const req = (field: string, value: string) => {
    if (!isFilled(value)) errors[field] = t.validation.required_field;
  };

  if (step === 0) {
    req("applicant_full_name", data.applicant_full_name);
    req("applicant_identification", data.applicant_identification);
    req("applicant_date_of_birth", data.applicant_date_of_birth);
    req("applicant_marital_status", data.applicant_marital_status);
    req("applicant_phone", data.applicant_phone);
    req("applicant_email", data.applicant_email);
    req("applicant_address", data.applicant_address);
    req("applicant_city", data.applicant_city);
    req("applicant_province", data.applicant_province);
    req("applicant_country", data.applicant_country);
    const applicantDoc = data.applicant_document_type || config.default_document_type;
    if (isFilled(data.applicant_identification) && !documentIsValid(applicantDoc, data.applicant_identification)) {
      errors.applicant_identification = applicantDoc === "CEDULA" ? t.validation.invalid_cedula : t.validation.invalid_passport;
    }
    const age = ageFromInput(data.applicant_date_of_birth);
    if (isFilled(data.applicant_date_of_birth) && age === null) {
      errors.applicant_date_of_birth = t.validation.age_invalid ?? "Fecha inválida";
    } else if (age !== null && age < config.min_age) {
      errors.applicant_date_of_birth = t.validation.age_min(config.min_age);
    } else if (age !== null && age > config.max_age) {
      errors.applicant_date_of_birth = t.validation.age_over_max;
    }
  }

  if (step === 1) {
    req("employment_type", data.employment_type);
    req("employer_name", data.employer_name);
    req("employment_position", data.employment_position);
    req("employment_start_date", data.employment_start_date);
    req("monthly_income", data.monthly_income);
    req("work_phone", data.work_phone);
    req("employer_address", data.employer_address);
    req("employer_province", data.employer_province);
    req("employer_city", data.employer_city);
    req("contract_type", data.contract_type);
    if (data.has_other_income === "yes") {
      if (data.other_incomes.length < 1) {
        errors.other_income_list = "Agregue al menos una fuente de ingreso";
      }
      data.other_incomes.forEach((row) => {
        if (!isFilled(row.amount) || numeric(row.amount) <= 0) {
          errors[`other_income_${row.id}_amount`] = "Monto requerido y mayor a 0";
        }
        if (!isFilled(row.concept)) {
          errors[`other_income_${row.id}_concept`] = "Concepto requerido";
        }
        if (!row.frequency) {
          errors[`other_income_${row.id}_frequency`] = "Frecuencia requerida";
        }
        if (row.frequency === "VARIABLE" && !isFilled(row.variable_avg_6_months ?? "")) {
          errors[`other_income_${row.id}_variable_avg`] = "Promedio requerido para ingreso variable";
        }
      });
    }
  }

  if (step === 2) {
    req("product_type", data.product_type);
    req("vehicle_make", data.vehicle_make);
    req("vehicle_model", data.vehicle_model);
    req("vehicle_year", data.vehicle_year);
    req("vehicle_price", data.vehicle_price);
    req("dealer_supplier", data.dealer_supplier);
    req("vehicle_condition", data.vehicle_condition);
  }

  if (step === 3) {
    if (data.co_debtor_required === "no" && !config.garante_required) return errors;
    req("co_debtor_full_name", data.co_debtor_full_name);
    req("co_debtor_identification", data.co_debtor_identification);
    req("co_debtor_date_of_birth", data.co_debtor_date_of_birth);
    req("co_debtor_phone", data.co_debtor_phone);
    req("co_debtor_email", data.co_debtor_email);
    req("co_debtor_address", data.co_debtor_address);
    req("co_debtor_province", data.co_debtor_province);
    req("co_debtor_city", data.co_debtor_city);
    req("co_debtor_monthly_income", data.co_debtor_monthly_income);
    req("co_debtor_relationship", data.co_debtor_relationship);
    req("co_debtor_employer_name", data.co_debtor_employer_name);
    req("co_debtor_employment_start_date", data.co_debtor_employment_start_date);
    // Merge inline errors from existing garante validation
    const garanteInline = getGaranteInlineErrors(data, config, t.validation);
    Object.assign(errors, garanteInline);
    // Check document validity
    const coDoc = data.co_debtor_document_type || config.default_document_type;
    if (isFilled(data.co_debtor_identification) && !documentIsValid(coDoc, data.co_debtor_identification)) {
      if (!errors.co_debtor_identification) {
        errors.co_debtor_identification = coDoc === "CEDULA" ? t.validation.invalid_cedula : t.validation.invalid_passport;
      }
    }
    // Check same cedula
    if (
      isFilled(data.co_debtor_identification) &&
      isFilled(data.applicant_identification) &&
      cleanDominicanCedula(data.co_debtor_identification) === cleanDominicanCedula(data.applicant_identification)
    ) {
      errors.co_debtor_identification = t.validation.cedula_match_applicant;
    }
  }

  if (step === 4) {
    config.required_documents
      .filter((d) => d.required)
      .forEach((d) => {
        const k = tenantDocumentKey(d);
        if (!data.documents_received[k]) {
          errors[`doc_${k}`] = `${d.label} es requerido`;
        }
      });
  }

  if (step === 5) {
    if (!data.consent_bureau_authorization) errors.consent_bureau_authorization = "Autorización de buró requerida";
    if (!data.consent_terms_accepted) errors.consent_terms_accepted = "Debe aceptar los términos";
    if (!data.consent_data_processing_authorization) errors.consent_data_processing_authorization = "Autorización de datos requerida";
    if (data.consent_presence === "present") {
      if (data.consent_signature_full_name.trim().length < 3) {
        errors.consent_signature_full_name = "Firma debe tener al menos 3 caracteres";
      }
      if (!data.consent_present_confirmed) errors.consent_present_confirmed = "Debe confirmar presencia";
    } else {
      if (!config.consent_application_id_ready) {
        errors.consent_application_id = "Se requiere ID de solicitud para consentimiento remoto";
      }
      const method = data.consent_method;
      if (method === "SMS_OTP") {
        if (!data.consent_sms_otp_sent) errors.consent_sms_otp_sent = "Debe enviar el OTP";
        if (data.consent_dealer_otp_code.trim().length !== 6) errors.consent_dealer_otp_code = "Código OTP debe tener 6 dígitos";
        if (!data.consent_accepted_at.trim()) errors.consent_accepted_at = "Falta confirmación de aceptación";
      }
      if ((method === "WHATSAPP" || method === "EMAIL" || method === "SELFIE") && !data.consent_accepted_at.trim()) {
        errors.consent_accepted_at = "Falta confirmación de aceptación";
      }
    }
  }

  return errors;
}

/**
 * Maps UI segment index to internal wizard steps and returns combined errors.
 * Segment 0 = steps 0+1 (Applicant + Employment)
 * Segment 1 = step 3 (Co-borrower)
 * Segment 2 = step 2 (Vehicle/Financial)
 * Segment 3 = step 4 (Documents)
 * Segment 4 = step 5 (Consents)
 */
export function getSegmentFieldErrors(
  segmentIndex: number,
  data: ApplicationFormData,
  config: WizardStepValidationConfig,
  t: CreditHubTranslations
): Record<string, string> {
  if (segmentIndex === 0) {
    return {
      ...getStepFieldErrors(0, data, config, t),
      ...getStepFieldErrors(1, data, config, t),
    };
  }
  if (segmentIndex === 1) return getStepFieldErrors(3, data, config, t);
  if (segmentIndex === 2) return getStepFieldErrors(2, data, config, t);
  if (segmentIndex === 3) return getStepFieldErrors(4, data, config, t);
  if (segmentIndex === 4) return getStepFieldErrors(5, data, config, t);
  return {};
}

/**
 * Returns array of 5 booleans indicating whether each segment is valid.
 */
export function getStepsValidity(
  data: ApplicationFormData,
  config: WizardStepValidationConfig,
  t: CreditHubTranslations
): boolean[] {
  return [0, 1, 2, 3, 4].map(
    (seg) => Object.keys(getSegmentFieldErrors(seg, data, config, t)).length === 0
  );
}

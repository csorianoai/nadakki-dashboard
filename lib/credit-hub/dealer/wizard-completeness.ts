import type { ApplicationFormData } from "@/components/credit-hub/dealer/wizard/WizardContainer";
import { stepIsValid, type WizardStepValidationConfig } from "@/components/credit-hub/dealer/wizard/WizardContainer";
import { DEALER_WIZARD_STEP_PATHS, type DealerWizardStepSlug } from "@/components/forge/credit-hub/dealer/dealerWizardPaths";
import type { CreditHubTranslations } from "@/lib/credit-hub/i18n/locales/es-DO/credit-hub";

function isFilled(v: string | undefined | null): boolean {
  return Boolean(v && String(v).trim());
}

/**
 * Pasos reales del asistente (DEALER_WIZARD_STEP_PATHS) → pasos de validación de WizardContainer.
 * Un solo origen: la completitud y las pistas leen de aquí; debe coincidir con segmentCanAdvance del Provider.
 */
const STEP_VALIDATION_INDEXES: Record<DealerWizardStepSlug, readonly number[]> = {
  applicant: [0, 1],
  consent: [5],
  vehicle: [2],
  review: [3, 4],
};

const STEP_WEIGHTS: Record<DealerWizardStepSlug, number> = { applicant: 30, consent: 20, vehicle: 25, review: 25 };

const STEP_HINTS: Record<DealerWizardStepSlug, string> = {
  applicant: "Solicitante, empleo e ingresos incompletos",
  consent: "Consentimiento pendiente",
  vehicle: "Vehículo y términos incompletos",
  review: "Documentos, referencias o co-firmante incompletos",
};

/** Validez de un paso real del asistente (índice 0-3 de DEALER_WIZARD_STEP_PATHS). */
export function dealerWizardStepValid(
  stepIndex: number,
  data: ApplicationFormData,
  config: WizardStepValidationConfig,
  t: CreditHubTranslations,
): boolean {
  const slug = DEALER_WIZARD_STEP_PATHS[stepIndex];
  if (!slug) return false;
  return STEP_VALIDATION_INDEXES[slug].every((i) => stepIsValid(i, data, config, t));
}

/** Campos rellenos de un paso real (0–1). Vacío = 0, así un paso opcional sin datos no suma. */
function filledRatio(slug: DealerWizardStepSlug, data: ApplicationFormData): number {
  let checks: boolean[] = [];
  if (slug === "applicant") {
    checks = [
      isFilled(data.applicant_full_name),
      isFilled(data.applicant_identification),
      isFilled(data.applicant_phone),
      isFilled(data.applicant_email),
      isFilled(data.employment_type),
      isFilled(data.employer_name),
      isFilled(data.monthly_income),
    ];
  } else if (slug === "consent") {
    checks = [data.consent_terms_accepted, data.consent_data_processing_authorization];
  } else if (slug === "vehicle") {
    checks = [isFilled(data.vehicle_make), isFilled(data.vehicle_model), isFilled(data.vehicle_price), isFilled(data.requested_amount)];
  } else {
    const docCount = Object.values(data.documents_received ?? {}).filter(Boolean).length;
    const filesCount = Object.values(data.document_files_ready ?? {}).filter(Boolean).length;
    checks = [docCount + filesCount > 0, (data.personal_references ?? []).some((r) => isFilled(r.nombre_completo)), isFilled(data.co_debtor_full_name)];
  }
  return checks.filter(Boolean).length / checks.length;
}

/** 0–100 completeness for wizard chrome: 0 con todo vacío, 100 solo con los 4 pasos válidos. */
export function computeWizardCompleteness(
  data: ApplicationFormData,
  config: WizardStepValidationConfig,
  t: CreditHubTranslations,
): number {
  const last = DEALER_WIZARD_STEP_PATHS.length - 1;
  const nothingRequiredInReview = !config.required_documents.some((d) => d.required);
  let total = 0;
  let allCounted = true;
  DEALER_WIZARD_STEP_PATHS.forEach((slug, i) => {
    const ratio = filledRatio(slug, data);
    if (dealerWizardStepValid(i, data, config, t)) {
      // Un paso válido pero vacío (opcional) no suma; solo el último, sin nada obligatorio, cuenta si los demás están completos.
      const counts = ratio > 0 || (i === last && nothingRequiredInReview && allCounted);
      if (counts) total += STEP_WEIGHTS[slug];
      else allCounted = false;
    } else {
      allCounted = false;
      total += STEP_WEIGHTS[slug] * Math.min(ratio, 0.99);
    }
  });
  return allCounted ? 100 : Math.min(99, Math.round(total));
}

export function missingFieldsHint(
  data: ApplicationFormData,
  config: WizardStepValidationConfig,
  t: CreditHubTranslations,
): string[] {
  return DEALER_WIZARD_STEP_PATHS.filter((_, i) => !dealerWizardStepValid(i, data, config, t)).map((slug) => STEP_HINTS[slug]);
}

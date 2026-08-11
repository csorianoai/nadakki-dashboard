import type { ApplicationFormData } from "@/components/credit-hub/dealer/wizard/WizardContainer";
import { stepIsValid, type WizardStepValidationConfig } from "@/components/credit-hub/dealer/wizard/WizardContainer";
import type { CreditHubTranslations } from "@/lib/credit-hub/i18n/locales/es-DO/credit-hub";

function isFilled(v: string | undefined | null): boolean {
  return Boolean(v && String(v).trim());
}

/** Rough field-fill score for a step (0–1) when not yet valid. */
function partialStepRatio(step: number, data: ApplicationFormData): number {
  const checks: boolean[] = [];
  if (step === 0) {
    checks.push(
      isFilled(data.applicant_full_name),
      isFilled(data.applicant_identification),
      isFilled(data.applicant_phone),
      isFilled(data.applicant_email),
    );
  } else if (step === 1) {
    checks.push(
      isFilled(data.employment_type),
      isFilled(data.employer_name),
      isFilled(data.monthly_income),
    );
  } else if (step === 2) {
    checks.push(
      isFilled(data.vehicle_make),
      isFilled(data.vehicle_model),
      isFilled(data.vehicle_price),
      isFilled(data.requested_amount),
    );
  } else if (step === 3) {
    const docCount = Object.values(data.documents_received ?? {}).filter(Boolean).length;
    checks.push(docCount > 0);
  } else if (step === 4) {
    checks.push(data.consent_terms_accepted);
  }
  if (checks.length === 0) return 0;
  return checks.filter(Boolean).length / checks.length;
}

/** 0–100 completeness for wizard chrome. */
export function computeWizardCompleteness(
  data: ApplicationFormData,
  config: WizardStepValidationConfig,
  t: CreditHubTranslations,
): number {
  const stepWeights = [22, 22, 22, 17, 17];
  let total = 0;
  for (let step = 0; step < 5; step++) {
    if (stepIsValid(step, data, config, t)) {
      total += stepWeights[step] ?? 0;
    } else {
      total += (stepWeights[step] ?? 0) * partialStepRatio(step, data);
    }
  }
  return Math.min(100, Math.round(total));
}

export function missingFieldsHint(
  data: ApplicationFormData,
  config: WizardStepValidationConfig,
  t: CreditHubTranslations,
): string[] {
  const hints: string[] = [];
  if (!stepIsValid(0, data, config, t)) hints.push("Datos del solicitante incompletos");
  if (!stepIsValid(1, data, config, t)) hints.push("Empleo e ingresos incompletos");
  if (!stepIsValid(2, data, config, t)) hints.push("Vehículo y términos incompletos");
  if (!stepIsValid(3, data, config, t)) hints.push("Co-firmante incompleto");
  if (!stepIsValid(4, data, config, t)) hints.push("Cédula frente o referencias incompletas");
  if (!stepIsValid(5, data, config, t)) hints.push("Consentimiento pendiente");
  return hints;
}

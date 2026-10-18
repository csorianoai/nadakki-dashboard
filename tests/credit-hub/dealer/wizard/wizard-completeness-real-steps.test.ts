/** DB-CODEX-25 (a): la completitud usa los 4 pasos reales. */
import { initialApplicationFormData, type ApplicationFormData } from "@/components/credit-hub/dealer/wizard/WizardContainer";
import { computeWizardCompleteness, missingFieldsHint } from "@/lib/credit-hub/dealer/wizard-completeness";
import { DEFAULT_DO_REQUIRED_DOCUMENTS } from "@/lib/credit-hub/defaults/do-required-documents";
import { filledApplicantForm, minimalT } from "./wizard-fixtures";

const config = {
  min_age: 18,
  max_age: 75,
  garante_required: false,
  default_document_type: "CEDULA",
  required_documents: DEFAULT_DO_REQUIRED_DOCUMENTS,
  consent_application_id_ready: true,
};

const allValid: ApplicationFormData = {
  ...filledApplicantForm,
  consent_terms_accepted: true,
  consent_data_processing_authorization: true,
  consent_signature_full_name: "Ana Prueba",
  consent_present_confirmed: true,
  applicant_identification: "05300030532",
  vehicle_decl_perdida_total: "no",
  vehicle_decl_accidentes: "no",
  vehicle_decl_gravamenes: "no",
  vehicle_decl_titulo_vendedor: "yes",
  vehicle_decl_km_coincide: "yes",
  vehicle_decl_signature_name: "Ana Prueba",
  documents_received: Object.fromEntries(DEFAULT_DO_REQUIRED_DOCUMENTS.map((d) => [d.key ?? d.id ?? d.type, true])),
};

describe("computeWizardCompleteness (pasos reales)", () => {
  test("0 % con el formulario inicial vacío", () => {
    expect(computeWizardCompleteness(initialApplicationFormData, config, minimalT as never)).toBe(0);
    expect(computeWizardCompleteness(initialApplicationFormData, { ...config, consent_application_id_ready: false }, minimalT as never)).toBe(0);
  });

  test("100 % solo con todos los pasos válidos", () => {
    expect(missingFieldsHint(allValid, config, minimalT as never)).toEqual([]);
    expect(computeWizardCompleteness(allValid, config, minimalT as never)).toBe(100);
    const sinConsentimiento = { ...allValid, consent_terms_accepted: false };
    expect(computeWizardCompleteness(sinConsentimiento, config, minimalT as never)).toBeLessThan(100);
  });

  test("las pistas salen de los 4 pasos reales", () => {
    expect(missingFieldsHint(initialApplicationFormData, config, minimalT as never)).toHaveLength(4);
  });
});

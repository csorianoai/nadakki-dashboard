import { initialApplicationFormData, stepIsValid } from "@/components/credit-hub/dealer/wizard/WizardContainer";
import { DEFAULT_DO_REQUIRED_DOCUMENTS } from "@/lib/credit-hub/defaults/do-required-documents";
import { getWizardSegmentValidation, WIZARD_ERROR_REQUIRED } from "@/lib/credit-hub/dealer/wizard-field-errors";
import { WIZARD_BUREAU_REQUIRED_NOTICE } from "@/lib/credit-hub/dealer/wizard-optional-notices";
import { consentCodesAccepted } from "@/lib/credit-hub/dealer/wizard-consent-codes";
import type { CreditHubTranslations } from "@/lib/credit-hub/i18n/locales/es-DO/credit-hub";
import esDO from "@/lib/credit-hub/i18n/locales/es-DO/credit-hub";

const t = esDO as CreditHubTranslations;
const config = {
  min_age: 18,
  max_age: 75,
  garante_required: false,
  default_document_type: "CEDULA",
  required_documents: DEFAULT_DO_REQUIRED_DOCUMENTS,
  consent_application_id_ready: true,
};

// DECISION_CESAR (ronda 3 de Cowork, 20-oct): BURO es obligatorio.
describe("consentimiento: códigos del backend y buró obligatorio", () => {
  it("traduce las casillas del asistente a los códigos que exige el backend", () => {
    expect(consentCodesAccepted({ terms: true, bureau: true, dataProcessing: true })).toEqual([
      "LEY_172_13",
      "BURO",
      "DATA_POLICY",
    ]);
    expect(consentCodesAccepted({ terms: true, bureau: false, dataProcessing: true })).toEqual(["LEY_172_13", "DATA_POLICY"]);
  });

  it("sin buró, el paso de consentimiento marca el campo como obligatorio", () => {
    const data = { ...initialApplicationFormData, consent_terms_accepted: true, consent_data_processing_authorization: true, consent_bureau_authorization: false };
    const r = getWizardSegmentValidation(4, data, config, t);
    expect(r.errors.consent_bureau_authorization).toBe(WIZARD_ERROR_REQUIRED);
    expect(stepIsValid(4, data, config, t)).toBe(false);
  });

  it("el aviso de buró dice obligatorio, no opcional", () => {
    expect(WIZARD_BUREAU_REQUIRED_NOTICE).not.toMatch(/opcional/i);
    expect(WIZARD_BUREAU_REQUIRED_NOTICE).toMatch(/obligatori/i);
  });
});

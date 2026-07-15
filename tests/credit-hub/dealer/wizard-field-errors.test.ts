import { initialApplicationFormData } from "@/components/credit-hub/dealer/wizard/WizardContainer";
import { DEFAULT_DO_REQUIRED_DOCUMENTS } from "@/lib/credit-hub/defaults/do-required-documents";
import { createEmptyPersonalReference } from "@/lib/credit-hub/dealer/wizard-gates";
import {
  getWizardSegmentValidation,
  WIZARD_ERROR_PHONE_MIN,
  WIZARD_ERROR_REQUIRED,
} from "@/lib/credit-hub/dealer/wizard-field-errors";
import type { CreditHubTranslations } from "@/lib/credit-hub/i18n/locales/es-DO/credit-hub";
import esDO from "@/lib/credit-hub/i18n/locales/es-DO/credit-hub";

const t = esDO as CreditHubTranslations;

const baseConfig = {
  min_age: 18,
  max_age: 75,
  garante_required: false,
  default_document_type: "CEDULA",
  required_documents: DEFAULT_DO_REQUIRED_DOCUMENTS,
  consent_application_id_ready: false,
};

describe("wizard-field-errors", () => {
  test("flags empty applicant phone on segment 0", () => {
    const data = { ...initialApplicationFormData, applicant_phone: "" };
    const result = getWizardSegmentValidation(0, data, baseConfig, t);
    expect(result.errors.applicant_phone).toBe(WIZARD_ERROR_REQUIRED);
    expect(result.summaries.some((s) => s.includes("teléfono"))).toBe(true);
  });

  test("accepts 12-digit reference phone on documents segment", () => {
    const ref = (name: string, phone: string) => ({
      ...createEmptyPersonalReference(),
      nombre_completo: name,
      direccion: "Calle 1",
      telefono: phone,
    });
    const data = {
      ...initialApplicationFormData,
      document_files_ready: { id_front: true, id_back: true, vehicle_documents: true },
      personal_references: [ref("A", "18095551234"), ref("B", "18095551235"), ref("C", "18095551236")],
    };
    const result = getWizardSegmentValidation(3, data, baseConfig, t);
    expect(result.errors.personal_reference_0_telefono).toBeUndefined();
    expect(result.summaries.filter((s) => s.includes("teléfono"))).toHaveLength(0);
  });

  test("flags short reference phone with min digits message", () => {
    const ref = {
      ...createEmptyPersonalReference(),
      nombre_completo: "Juan",
      direccion: "Calle 1",
      telefono: "80955",
    };
    const data = {
      ...initialApplicationFormData,
      document_files_ready: { id_front: true, id_back: true, vehicle_documents: true },
      personal_references: [ref, ref, ref],
    };
    const result = getWizardSegmentValidation(3, data, baseConfig, t);
    expect(result.errors.personal_reference_0_telefono).toBe(WIZARD_ERROR_PHONE_MIN);
    expect(result.summaries.some((s) => s.includes("Referencia 1"))).toBe(true);
  });
});

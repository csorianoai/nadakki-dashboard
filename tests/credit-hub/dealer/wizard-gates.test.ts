import {
  createEmptyPersonalReference,
  hasIdFrontFileReady,
  initialPersonalReferences,
  isPersonalReferenceComplete,
  personalReferencesValid,
  wizardDocumentsStepValid,
} from "@/lib/credit-hub/dealer/wizard-gates";
import { buildCreateApplicationPayload, initialApplicationFormData } from "@/components/credit-hub/dealer/wizard/WizardContainer";

function completeRef(name: string, phone = "8095551234") {
  return { ...createEmptyPersonalReference(), nombre_completo: name, direccion: "Calle 1, SD", telefono: phone };
}

describe("wizard-gates", () => {
  test("requires id_front file upload", () => {
    expect(hasIdFrontFileReady({ document_files_ready: {} })).toBe(false);
    expect(hasIdFrontFileReady({ document_files_ready: { id_front: true } })).toBe(true);
  });

  test("requires 3 complete personal references", () => {
    const two = [completeRef("A"), completeRef("B")];
    expect(personalReferencesValid(two)).toBe(false);
    expect(personalReferencesValid([...two, completeRef("C")])).toBe(true);
  });

  test("reference phone needs at least 10 digits", () => {
    expect(isPersonalReferenceComplete(completeRef("X", "809555"))).toBe(false);
    expect(isPersonalReferenceComplete(completeRef("X", "8095551234"))).toBe(true);
  });

  test("wizardDocumentsStepValid combines id front and references", () => {
    const base = {
      ...initialApplicationFormData,
      document_files_ready: { id_front: true },
      personal_references: initialPersonalReferences().map((r, i) =>
        i < 3 ? completeRef(`Ref ${i + 1}`) : r,
      ),
    };
    expect(wizardDocumentsStepValid(base)).toBe(true);
    expect(wizardDocumentsStepValid({ ...base, document_files_ready: {} })).toBe(false);
    expect(
      wizardDocumentsStepValid({
        ...base,
        personal_references: [completeRef("Only one")],
      }),
    ).toBe(false);
  });

  test("payload includes referencias_personales on applicant", () => {
    const form = {
      ...initialApplicationFormData,
      applicant_full_name: "Ana Pérez",
      applicant_identification: "05300030532",
      applicant_document_type: "CEDULA",
      applicant_date_of_birth: "1990-01-01",
      applicant_marital_status: "single",
      applicant_email: "ana@example.com",
      applicant_phone: "8095550000",
      applicant_address: "Calle 1",
      applicant_city: "Santo Domingo",
      applicant_province: "Distrito Nacional",
      applicant_country: "RD",
      personal_references: [completeRef("Juan Pérez"), completeRef("María López"), completeRef("Pedro Ruiz")],
    };
    const payload = buildCreateApplicationPayload(form as typeof initialApplicationFormData, {
      defaultDocumentType: "CEDULA",
    });
    expect(payload.applicant.referencias_personales).toEqual([
      { nombre_completo: "Juan Pérez", direccion: "Calle 1, SD", telefono: "8095551234" },
      { nombre_completo: "María López", direccion: "Calle 1, SD", telefono: "8095551234" },
      { nombre_completo: "Pedro Ruiz", direccion: "Calle 1, SD", telefono: "8095551234" },
    ]);
  });
});

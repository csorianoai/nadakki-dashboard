import {
  buildConsentDocumentsSummary,
  buildDocumentosPayload,
  createEmptyPersonalReference,
  hasRequiredDocumentsFileReady,
  initialPersonalReferences,
  isPersonalReferenceComplete,
  personalReferencesValid,
  wizardDocumentsStepValid,
} from "@/lib/credit-hub/dealer/wizard-gates";
import { DEFAULT_DO_REQUIRED_DOCUMENTS } from "@/lib/credit-hub/defaults/do-required-documents";
import {
  buildCreateApplicationPayload,
  initialApplicationFormData,
  tenantDocumentKey,
} from "@/components/credit-hub/dealer/wizard/WizardContainer";

function completeRef(name: string, phone = "8095551234") {
  return { ...createEmptyPersonalReference(), nombre_completo: name, direccion: "Calle 1, SD", telefono: phone };
}

describe("wizard-gates", () => {
  test("requires vehicle document upload only", () => {
    expect(hasRequiredDocumentsFileReady({ document_files_ready: {} })).toBe(false);
    expect(hasRequiredDocumentsFileReady({ document_files_ready: { id_front: true, id_back: true } })).toBe(false);
    expect(hasRequiredDocumentsFileReady({ document_files_ready: { vehicle_documents: true } })).toBe(true);
  });

  test("requires 3 complete personal references", () => {
    const two = [completeRef("A"), completeRef("B")];
    expect(personalReferencesValid(two)).toBe(false);
    expect(personalReferencesValid([...two, completeRef("C")])).toBe(true);
  });

  test("reference phone needs at least 7 digits", () => {
    expect(isPersonalReferenceComplete(completeRef("X", "809555"))).toBe(false);
    expect(isPersonalReferenceComplete(completeRef("X", "8095551"))).toBe(true);
    expect(isPersonalReferenceComplete(completeRef("X", "8095551234"))).toBe(true);
    expect(isPersonalReferenceComplete(completeRef("X", "18095551234"))).toBe(true);
  });

  test("wizardDocumentsStepValid combines required docs and references", () => {
    const base = {
      ...initialApplicationFormData,
      document_files_ready: { vehicle_documents: true },
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

  test("buildDocumentosPayload maps keys and optional selection", () => {
    const form = {
      documents_received: { id_front: true, id_back: true, vehicle_documents: true, employment_letter: true },
      document_files_ready: {
        id_front: true,
        id_back: true,
        vehicle_documents: true,
        employment_letter: true,
      },
    };
    const payload = buildDocumentosPayload(form, DEFAULT_DO_REQUIRED_DOCUMENTS, tenantDocumentKey);
    expect(payload.id_front).toEqual({ uploaded: true });
    expect(payload.id_back).toEqual({ uploaded: true });
    expect(payload.vehicle_docs).toEqual({ uploaded: true });
    expect(payload.employment_letter).toEqual({ uploaded: true });
    expect(payload.bank_statements).toEqual({ uploaded: false });
    expect(payload.proof_of_address).toEqual({ uploaded: false });
  });

  test("buildConsentDocumentsSummary uses neutral attached counts", () => {
    const summary = buildConsentDocumentsSummary(
      {
        documents_received: { id_front: true, id_back: true, vehicle_documents: true },
        document_files_ready: { vehicle_documents: true },
      },
      DEFAULT_DO_REQUIRED_DOCUMENTS,
      tenantDocumentKey,
    );
    expect(summary.attachedCount).toBe(1);
    expect(summary.totalCount).toBe(DEFAULT_DO_REQUIRED_DOCUMENTS.length);
    expect(summary.items.find((item) => item.key === "bank_statements")?.attached).toBe(false);
  });

  test("payload includes referencias_personales and documentos", () => {
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
      document_files_ready: { vehicle_documents: true },
      personal_references: [completeRef("Juan Pérez"), completeRef("María López"), completeRef("Pedro Ruiz")],
    };
    const payload = buildCreateApplicationPayload(form as typeof initialApplicationFormData, {
      defaultDocumentType: "CEDULA",
      wizardDocuments: DEFAULT_DO_REQUIRED_DOCUMENTS,
    });
    expect(payload.applicant.referencias_personales).toEqual([
      { nombre_completo: "Juan Pérez", direccion: "Calle 1, SD", telefono: "8095551234" },
      { nombre_completo: "María López", direccion: "Calle 1, SD", telefono: "8095551234" },
      { nombre_completo: "Pedro Ruiz", direccion: "Calle 1, SD", telefono: "8095551234" },
    ]);
    expect(payload.documentos?.vehicle_docs).toEqual({ uploaded: true });
    expect(payload.documentos?.bank_statements).toEqual({ uploaded: false });
  });
});

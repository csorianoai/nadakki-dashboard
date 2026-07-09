import type { TenantRequiredDocument } from "@/lib/credit-hub/types/tenantConfig";

export const WIZARD_REQUIRED_DOCUMENT_KEY = "id_front";
export const PERSONAL_REFERENCES_MIN = 3;
export const PERSONAL_REFERENCES_MAX = 5;

export interface PersonalReferenceFormRow {
  id: string;
  nombre_completo: string;
  direccion: string;
  telefono: string;
}

export function newPersonalReferenceRowId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `ref-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createEmptyPersonalReference(): PersonalReferenceFormRow {
  return { id: newPersonalReferenceRowId(), nombre_completo: "", direccion: "", telefono: "" };
}

export function initialPersonalReferences(count = PERSONAL_REFERENCES_MIN): PersonalReferenceFormRow[] {
  return Array.from({ length: count }, () => createEmptyPersonalReference());
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function isPersonalReferenceComplete(ref: PersonalReferenceFormRow): boolean {
  return (
    ref.nombre_completo.trim().length > 0 &&
    ref.direccion.trim().length > 0 &&
    digitsOnly(ref.telefono).length >= 10
  );
}

export function countCompletePersonalReferences(refs: PersonalReferenceFormRow[]): number {
  return refs.filter(isPersonalReferenceComplete).length;
}

export function personalReferencesValid(refs: PersonalReferenceFormRow[] | undefined): boolean {
  return countCompletePersonalReferences(refs ?? []) >= PERSONAL_REFERENCES_MIN;
}

export function hasIdFrontFileReady(data: {
  document_files_ready?: Record<string, boolean>;
  documents_received?: Record<string, boolean>;
}): boolean {
  return Boolean(
    data.document_files_ready?.[WIZARD_REQUIRED_DOCUMENT_KEY] ??
      data.documents_received?.[WIZARD_REQUIRED_DOCUMENT_KEY],
  );
}

export function wizardDocumentsStepValid(data: {
  document_files_ready?: Record<string, boolean>;
  personal_references?: PersonalReferenceFormRow[];
}): boolean {
  return hasIdFrontFileReady(data) && personalReferencesValid(data.personal_references);
}

export function listPendingOptionalDocuments(
  data: { document_files_ready?: Record<string, boolean> },
  docList: TenantRequiredDocument[],
  tenantDocumentKey: (doc: TenantRequiredDocument) => string,
): string[] {
  return docList
    .filter((d) => !d.required)
    .filter((d) => {
      const key = tenantDocumentKey(d);
      return !data.document_files_ready?.[key];
    })
    .map((d) => d.label);
}

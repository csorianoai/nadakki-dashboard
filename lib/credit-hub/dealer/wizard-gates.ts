import type { TenantRequiredDocument } from "@/lib/credit-hub/types/tenantConfig";

export const WIZARD_REQUIRED_DOCUMENT_KEYS = ["id_front", "id_back", "vehicle_documents"] as const;
export type WizardRequiredDocumentKey = (typeof WIZARD_REQUIRED_DOCUMENT_KEYS)[number];

/** @deprecated Use WIZARD_REQUIRED_DOCUMENT_KEYS */
export const WIZARD_REQUIRED_DOCUMENT_KEY = "id_front";

export const PERSONAL_REFERENCES_MIN = 3;
export const PERSONAL_REFERENCES_MAX = 5;

/** Maps wizard checklist keys to backend `documentos` payload keys. */
export const DOCUMENT_KEY_TO_PAYLOAD_KEY: Record<string, string> = {
  id_front: "id_front",
  id_back: "id_back",
  vehicle_documents: "vehicle_docs",
  employment_letter: "employment_letter",
  pay_stubs: "pay_stubs",
  income_evidence: "pay_stubs",
  bank_statements: "bank_statements",
  tax_return: "tax_return",
  address_proof: "proof_of_address",
  other_documents: "other_documents",
};

export type DocumentoPayloadEntry = { uploaded: boolean; file_id?: string };
export type DocumentosPayload = Record<string, DocumentoPayloadEntry>;

export interface PersonalReferenceFormRow {
  id: string;
  nombre_completo: string;
  direccion: string;
  telefono: string;
}

export interface ConsentDocumentSummaryItem {
  key: string;
  label: string;
  attached: boolean;
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

export function isWizardRequiredDocumentKey(key: string): key is WizardRequiredDocumentKey {
  return (WIZARD_REQUIRED_DOCUMENT_KEYS as readonly string[]).includes(key);
}

export function documentFileReady(
  data: { document_files_ready?: Record<string, boolean> },
  key: string,
): boolean {
  return Boolean(data.document_files_ready?.[key]);
}

export function hasRequiredDocumentsFileReady(data: {
  document_files_ready?: Record<string, boolean>;
}): boolean {
  return WIZARD_REQUIRED_DOCUMENT_KEYS.every((key) => documentFileReady(data, key));
}

/** @deprecated Use hasRequiredDocumentsFileReady */
export function hasIdFrontFileReady(data: { document_files_ready?: Record<string, boolean> }): boolean {
  return hasRequiredDocumentsFileReady(data);
}

export function isDocumentSelected(
  data: { documents_received?: Record<string, boolean> },
  doc: TenantRequiredDocument,
  tenantDocumentKey: (doc: TenantRequiredDocument) => string,
): boolean {
  const key = tenantDocumentKey(doc);
  if (isWizardRequiredDocumentKey(key)) return true;
  return Boolean(data.documents_received?.[key]);
}

export function wizardDocumentsStepValid(data: {
  document_files_ready?: Record<string, boolean>;
  personal_references?: PersonalReferenceFormRow[];
}): boolean {
  return hasRequiredDocumentsFileReady(data) && personalReferencesValid(data.personal_references);
}

export function buildDocumentosPayload(
  data: {
    document_files_ready?: Record<string, boolean>;
    documents_received?: Record<string, boolean>;
  },
  docList: TenantRequiredDocument[],
  tenantDocumentKey: (doc: TenantRequiredDocument) => string,
): DocumentosPayload {
  const payload: DocumentosPayload = {};
  for (const doc of docList) {
    const key = tenantDocumentKey(doc);
    const payloadKey = DOCUMENT_KEY_TO_PAYLOAD_KEY[key] ?? key;
    const selected = isDocumentSelected(data, doc, tenantDocumentKey);
    const uploaded = selected && documentFileReady(data, key);
    payload[payloadKey] = uploaded ? { uploaded: true } : { uploaded: false };
  }
  return payload;
}

export function buildConsentDocumentsSummary(
  data: {
    document_files_ready?: Record<string, boolean>;
    documents_received?: Record<string, boolean>;
  },
  docList: TenantRequiredDocument[],
  tenantDocumentKey: (doc: TenantRequiredDocument) => string,
): { attachedCount: number; totalCount: number; items: ConsentDocumentSummaryItem[] } {
  const items = docList.map((doc) => {
    const key = tenantDocumentKey(doc);
    const attached = isDocumentSelected(data, doc, tenantDocumentKey) && documentFileReady(data, key);
    return { key, label: doc.label, attached };
  });
  return {
    attachedCount: items.filter((item) => item.attached).length,
    totalCount: items.length,
    items,
  };
}

export function missingRequiredDocumentLabels(
  data: {
    document_files_ready?: Record<string, boolean>;
    documents_received?: Record<string, boolean>;
  },
  docList: TenantRequiredDocument[],
  tenantDocumentKey: (doc: TenantRequiredDocument) => string,
): string[] {
  return docList
    .filter((doc) => isWizardRequiredDocumentKey(tenantDocumentKey(doc)))
    .filter((doc) => !documentFileReady(data, tenantDocumentKey(doc)))
    .map((doc) => doc.label);
}

export function extractDocumentosFromApplicationRaw(raw: unknown): DocumentosPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const candidates = [
    record.documentos,
    (record.payload as Record<string, unknown> | undefined)?.documentos,
    (record.application_data as Record<string, unknown> | undefined)?.documentos,
    (record.documents as Record<string, unknown> | undefined)?.documentos,
  ];
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) continue;
    const payload: DocumentosPayload = {};
    for (const [key, value] of Object.entries(candidate)) {
      if (!value || typeof value !== "object" || Array.isArray(value)) continue;
      const entry = value as Record<string, unknown>;
      payload[key] = {
        uploaded: Boolean(entry.uploaded),
        ...(typeof entry.file_id === "string" ? { file_id: entry.file_id } : {}),
      };
    }
    if (Object.keys(payload).length > 0) return payload;
  }
  return null;
}

export function resolveApplicationDocumentStatus(
  docList: TenantRequiredDocument[],
  tenantDocumentKey: (doc: TenantRequiredDocument) => string,
  documentos: DocumentosPayload | null,
): Array<{ key: string; label: string; uploaded: boolean }> {
  return docList.map((doc) => {
    const key = tenantDocumentKey(doc);
    const payloadKey = DOCUMENT_KEY_TO_PAYLOAD_KEY[key] ?? key;
    const entry = documentos?.[payloadKey] ?? documentos?.[key];
    return {
      key,
      label: doc.label,
      uploaded: Boolean(entry?.uploaded),
    };
  });
}

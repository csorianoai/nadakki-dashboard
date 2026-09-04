import type { BankDocumentPayload } from "../types/bank-views";

type RawDocument = Record<string, unknown>;

function asRecord(value: unknown): RawDocument {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as RawDocument) : {};
}

/** Normalize detail and /documents responses into the bank card contract. */
export function normalizeBankDocuments(raw: unknown): BankDocumentPayload[] {
  if (!Array.isArray(raw)) return [];

  return raw.map((value) => {
    const document = asRecord(value);
    return {
      ...document,
      id: document.id ?? document.doc_id,
      name: document.name ?? document.filename ?? document.label,
      status: document.status ?? document.extraction_status,
      type: document.type ?? document.kind,
    } as BankDocumentPayload;
  });
}

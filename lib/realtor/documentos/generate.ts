import { apiFetch } from "@/lib/api/fetch-client";
import { BASE_OLA3 } from "./api";

/** Plantillas del backend (ROP-G6-GENERAR-DOC-API): solo estos tipos tienen plantilla; el resto es 422. */
export const GEN_DOC_TYPES = ["lease_agreement", "sale_contract", "receipt"] as const;
export type GenDocType = (typeof GEN_DOC_TYPES)[number];

export type GenerateFailure = "forbidden" | "not_found" | "conflict" | "invalid" | "storage" | "error";
export type GenerateResult = { ok: true } | { ok: false; reason: GenerateFailure };

const BY_STATUS: Record<number, GenerateFailure> = { 403: "forbidden", 404: "not_found", 409: "conflict", 422: "invalid", 502: "storage" };

/**
 * POST /operations/{id}/documents/generate?doc_type=… same-origin, sin cuerpo. El tenant sale del JWT que añade apiFetch:
 * el cliente no lo envía. 201 = borrador registrado; cualquier otro estado se traduce a una causa visible.
 */
export async function generateDocument(operationId: string, docType: GenDocType): Promise<GenerateResult> {
  try {
    const q = new URLSearchParams({ doc_type: docType });
    const res = await apiFetch(`${BASE_OLA3}/operations/${encodeURIComponent(operationId)}/documents/generate?${q}`, { method: "POST" });
    if (res.status === 201) return { ok: true };
    return { ok: false, reason: BY_STATUS[res.status] ?? "error" };
  } catch {
    return { ok: false, reason: "error" };
  }
}

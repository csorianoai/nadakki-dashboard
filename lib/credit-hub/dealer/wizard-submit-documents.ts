import { CreditCoreApiError, type DocumentCompleteness } from "@/lib/credit-hub/api/creditCoreClient";

export type PendingUploadStatus = "uploading" | "uploaded" | "error";

export interface PendingUploadInput {
  file: File;
  status: string;
}

export class DocumentsGateError extends Error {
  constructor(
    message: string,
    public missing: string[] = [],
    public failedKeys: string[] = [],
  ) {
    super(message);
    this.name = "DocumentsGateError";
  }
}

/**
 * Sube con await, uno a uno, los ficheros pendientes (omite los ya subidos), exige que
 * cada uno termine bien, consulta completeness del servidor y solo entonces despacha.
 * Cualquier fallo lanza DocumentsGateError sin llamar a dispatch.
 */
export async function uploadThenDispatch<T>(params: {
  files: Map<string, PendingUploadInput>;
  upload: (key: string, file: File) => Promise<unknown>;
  onStatus: (key: string, status: PendingUploadStatus, errorMessage: string | null) => void;
  getCompleteness: () => Promise<DocumentCompleteness>;
  labelForMissing: (code: string) => string;
  dispatch: () => Promise<T>;
}): Promise<T> {
  const failedKeys: string[] = [];
  let firstError = "";
  for (const [key, entry] of params.files) {
    if (entry.status === "uploaded") continue;
    params.onStatus(key, "uploading", null);
    try {
      await params.upload(key, entry.file);
      params.onStatus(key, "uploaded", null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido al subir";
      if (!firstError) firstError = message;
      failedKeys.push(key);
      params.onStatus(key, "error", message);
    }
  }
  if (failedKeys.length > 0) {
    throw new DocumentsGateError(
      `No se pudieron subir ${failedKeys.length} documento(s): ${firstError}. Reintenta el envío.`,
      [],
      failedKeys,
    );
  }
  const completeness = await params.getCompleteness();
  if (!completeness.complete) {
    const labels = (completeness.missing ?? []).map(params.labelForMissing);
    throw new DocumentsGateError(
      labels.length > 0
        ? `Faltan documentos obligatorios: ${labels.join(", ")}.`
        : "El servidor indica que la documentación está incompleta.",
      labels,
    );
  }
  return params.dispatch();
}

function findMissing(detail: unknown): string[] | null {
  if (!detail || typeof detail !== "object") return null;
  const rec = detail as Record<string, unknown>;
  if (rec.error === "documents_incomplete" || rec.code === "documents_incomplete") {
    return Array.isArray(rec.missing) ? rec.missing.map(String) : [];
  }
  return findMissing(rec.detail);
}

/** Mensaje para el 409 documents_incomplete del backend; null si el error es otro. */
export function documentsIncompleteMessage(err: unknown, labelForMissing: (code: string) => string): string | null {
  if (!(err instanceof CreditCoreApiError) || err.status !== 409) return null;
  const missing = findMissing(err.detail);
  if (!missing) return null;
  const labels = missing.map(labelForMissing);
  return labels.length > 0
    ? `Faltan documentos obligatorios: ${labels.join(", ")}.`
    : "El servidor indica que la documentación está incompleta.";
}

import type { DocumentClassification } from "./documentos-constants";
import { ALLOWED_EXTENSION_SET, DOCUMENT_CLASSIFICATIONS } from "./documentos-constants";

export interface ProyectoDocumento {
  id: string;
  project_id?: string;
  doc_type: string;
  doc_subtype?: string | null;
  filename_original: string;
  sha256_hash?: string;
  size_bytes: number;
  mime_type?: string;
  classification: DocumentClassification | string;
  version?: number;
  uploaded_at?: string;
  uploaded_by?: string | null;
}

export function normalizeDocumentList(raw: unknown): ProyectoDocumento[] {
  const list = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object"
      ? ((raw as Record<string, unknown>).items ??
          (raw as Record<string, unknown>).data ??
          (raw as Record<string, unknown>).documentos ??
          (raw as Record<string, unknown>).results)
      : null;

  if (!Array.isArray(list)) return [];

  const out: ProyectoDocumento[] = [];
  for (const entry of list) {
    if (!entry || typeof entry !== "object") continue;
    const o = entry as Record<string, unknown>;
    const id = String(o.id ?? o.documento_id ?? o.document_id ?? "");
    if (!id) continue;
    out.push({
      id,
      project_id: typeof o.project_id === "string" ? o.project_id : undefined,
      doc_type: String(o.doc_type ?? "otro"),
      doc_subtype: typeof o.doc_subtype === "string" ? o.doc_subtype : null,
      filename_original: String(o.filename_original ?? o.filename ?? o.name ?? "documento"),
      sha256_hash: typeof o.sha256_hash === "string" ? o.sha256_hash : undefined,
      size_bytes: typeof o.size_bytes === "number" ? o.size_bytes : Number(o.size_bytes) || 0,
      mime_type: typeof o.mime_type === "string" ? o.mime_type : undefined,
      classification: String(o.classification ?? "confidential"),
      version: typeof o.version === "number" ? o.version : undefined,
      uploaded_at: typeof o.uploaded_at === "string" ? o.uploaded_at : undefined,
      uploaded_by: typeof o.uploaded_by === "string" ? o.uploaded_by : null,
    });
  }
  return out;
}

export function formatDocumentBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatRelativeUploadTime(iso: string | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "ahora";
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `hace ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "ayer";
  if (diffD < 7) return `hace ${diffD} días`;
  return date.toLocaleDateString("es-DO", { day: "numeric", month: "short", year: "numeric" });
}

export function fileExtension(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx + 1).toLowerCase() : "";
}

export function validateDocumentFile(file: File): string | null {
  const ext = fileExtension(file.name);
  if (!ext || !ALLOWED_EXTENSION_SET.has(ext)) {
    return `Extensión no permitida (.${ext || "?"}). Permitidas: ${[...ALLOWED_EXTENSION_SET].join(", ")}`;
  }
  if (file.size > 20 * 1024 * 1024) {
    return `El archivo supera 20 MB (${formatDocumentBytes(file.size)}).`;
  }
  if (file.size <= 0) {
    return "El archivo está vacío.";
  }
  return null;
}

export function isDocumentClassification(value: string): value is DocumentClassification {
  return (DOCUMENT_CLASSIFICATIONS as readonly string[]).includes(value);
}

export function docTypeLabel(value: string): string {
  return value.replace(/_/g, " ");
}

export function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "es"));
}

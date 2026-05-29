/**
 * Document Intelligence — Credit API v2 (same host as `lib/credit-api`).
 *
 * Expected routes (tune backend to match):
 * - POST   .../applications/{applicationId}/documents/{documentId}/process
 * - POST   .../applications/{applicationId}/documents/process-all
 * - GET    .../applications/{applicationId}/documents/{documentId}/extracted-fields
 * - POST   .../applications/{applicationId}/face-match
 * - GET    .../applications/{applicationId}/fraud-signals
 * - POST   .../applications/{applicationId}/documents/{documentId}/review
 * - GET    .../applications/{applicationId}/documents/history
 */

import { CreditApiError } from "@/lib/credit-api";
import { tokenStorage } from "@/lib/auth/token-storage";

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
).replace(/\/$/, "");
const LEGACY_ACCESS_TOKEN_STORAGE_KEY = "nadakki_sic_token";

export type ExtractionStatus =
  | "pending"
  | "processing"
  | "completed"
  | "needs_review"
  | "failed";

const APP_PREFIX = (applicationId: string) =>
  `${BACKEND_URL}/api/v2/credit/applications/${encodeURIComponent(applicationId)}`;

function requireTenant(tenantId: string): string {
  const t = tenantId?.trim() ?? "";
  if (!t) {
    throw new CreditApiError("Seleccione una institución", 0);
  }
  return t;
}

function readBearerAccessToken(): string | null {
  const fromAuthV2 = tokenStorage.getAccessToken();
  if (fromAuthV2) return fromAuthV2;
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(LEGACY_ACCESS_TOKEN_STORAGE_KEY);
}

function baseHeaders(tenantId: string, withJson: boolean): HeadersInit {
  const h: Record<string, string> = {
    Accept: "application/json",
    "X-Tenant-ID": tenantId.trim(),
  };
  const bearerAccessToken = readBearerAccessToken();
  if (bearerAccessToken) {
    h["Authorization"] = `Bearer ${bearerAccessToken}`;
  }
  if (withJson) h["Content-Type"] = "application/json";
  return h;
}

async function parseDetail(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

async function handleJson<T>(res: Response): Promise<T> {
  const detail = await parseDetail(res);
  if (!res.ok) {
    let msg = `Error HTTP ${res.status}`;
    if (detail && typeof detail === "object" && detail !== null) {
      const root = detail as Record<string, unknown>;
      const d = root.detail;
      if (typeof d === "string") msg = d;
      else if (typeof root.message === "string") msg = root.message;
    } else if (typeof detail === "string") msg = detail;
    throw new CreditApiError(msg, res.status, detail);
  }
  return detail as T;
}

function normalizeStatus(raw: unknown): ExtractionStatus {
  const s = String(raw ?? "pending").toLowerCase().replace(/\s+/g, "_");
  if (
    s === "pending" ||
    s === "processing" ||
    s === "completed" ||
    s === "needs_review" ||
    s === "failed"
  ) {
    return s;
  }
  if (s === "complete") return "completed";
  if (s === "need_review" || s === "review") return "needs_review";
  if (s === "error") return "failed";
  return "pending";
}

export interface ExtractedFieldsPayload {
  extraction_status: ExtractionStatus;
  extraction_confidence: number | null;
  extracted_fields: Record<string, unknown> | null;
  error_message?: string | null;
}

function unwrap<T extends Record<string, unknown>>(raw: unknown): T | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const data = r.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    return data as T;
  }
  return r as T;
}

export async function getExtractedFields(
  applicationId: string,
  documentId: string,
  tenantId: string
): Promise<ExtractedFieldsPayload> {
  const tid = requireTenant(tenantId);
  const res = await fetch(
    `${APP_PREFIX(applicationId)}/documents/${encodeURIComponent(documentId)}/extracted-fields`,
    { headers: baseHeaders(tid, false) }
  );
  const json = await handleJson<unknown>(res);
  const d = unwrap<Record<string, unknown>>(json) ?? {};
  const fieldsRaw = d.extracted_fields ?? d.fields ?? d.extractedFields;
  return {
    extraction_status: normalizeStatus(
      d.extraction_status ?? d.status ?? d.extractionStatus
    ),
    extraction_confidence:
      d.extraction_confidence != null
        ? Number(d.extraction_confidence)
        : d.confidence != null
          ? Number(d.confidence)
          : null,
    extracted_fields:
      fieldsRaw && typeof fieldsRaw === "object" && !Array.isArray(fieldsRaw)
        ? (fieldsRaw as Record<string, unknown>)
        : null,
    error_message:
      d.error_message != null
        ? String(d.error_message)
        : d.error != null
          ? String(d.error)
          : null,
  };
}

export async function processDocument(
  applicationId: string,
  documentId: string,
  tenantId: string
): Promise<Record<string, unknown>> {
  const tid = requireTenant(tenantId);
  const res = await fetch(
    `${APP_PREFIX(applicationId)}/documents/${encodeURIComponent(documentId)}/process`,
    {
      method: "POST",
      headers: baseHeaders(tid, true),
      body: JSON.stringify({}),
    }
  );
  return handleJson(res);
}

export async function processAllDocuments(
  applicationId: string,
  tenantId: string
): Promise<Record<string, unknown>> {
  const tid = requireTenant(tenantId);
  const res = await fetch(
    `${APP_PREFIX(applicationId)}/documents/process-all`,
    {
      method: "POST",
      headers: baseHeaders(tid, true),
      body: JSON.stringify({}),
    }
  );
  return handleJson(res);
}

export interface FaceMatchResult {
  score: number | null;
  status: string | null;
  raw?: Record<string, unknown>;
}

export async function runFaceMatch(
  applicationId: string,
  tenantId: string
): Promise<FaceMatchResult> {
  const tid = requireTenant(tenantId);
  const res = await fetch(`${APP_PREFIX(applicationId)}/face-match`, {
    method: "POST",
    headers: baseHeaders(tid, true),
    body: JSON.stringify({}),
  });
  const json = await handleJson<unknown>(res);
  const d = unwrap<Record<string, unknown>>(json) ?? (json as Record<string, unknown>) ?? {};
  return {
    score:
      d.score != null
        ? Number(d.score)
        : d.match_score != null
          ? Number(d.match_score)
          : null,
    status:
      d.status != null
        ? String(d.status)
        : d.match_status != null
          ? String(d.match_status)
          : null,
    raw: d,
  };
}

export interface FraudSignalsPayload {
  fraud_score: number | null;
  risk_level: string | null;
  flags: string[];
  raw?: Record<string, unknown>;
}

export async function getFraudSignals(
  applicationId: string,
  tenantId: string
): Promise<FraudSignalsPayload> {
  const tid = requireTenant(tenantId);
  const res = await fetch(`${APP_PREFIX(applicationId)}/fraud-signals`, {
    headers: baseHeaders(tid, false),
  });
  const json = await handleJson<unknown>(res);
  const d = unwrap<Record<string, unknown>>(json) ?? (json as Record<string, unknown>) ?? {};
  const flagsRaw = d.flags ?? d.risk_flags ?? d.signals;
  const flags = Array.isArray(flagsRaw)
    ? flagsRaw.map((x) => String(x))
    : [];
  return {
    fraud_score:
      d.fraud_score != null
        ? Number(d.fraud_score)
        : d.score != null
          ? Number(d.score)
          : null,
    risk_level:
      d.risk_level != null
        ? String(d.risk_level)
        : d.riskLevel != null
          ? String(d.riskLevel)
          : null,
    flags,
    raw: d,
  };
}

export type ReviewDecision = "approve" | "reject" | "needs_review";

export interface DocumentReviewPayload {
  decision: ReviewDecision;
  notes?: string;
}

export async function reviewDocument(
  applicationId: string,
  documentId: string,
  payload: DocumentReviewPayload,
  tenantId: string
): Promise<Record<string, unknown>> {
  const tid = requireTenant(tenantId);
  if (payload.decision === "reject" && !(payload.notes?.trim())) {
    throw new CreditApiError(
      "Las notas son obligatorias para rechazar.",
      0
    );
  }
  const res = await fetch(
    `${APP_PREFIX(applicationId)}/documents/${encodeURIComponent(documentId)}/review`,
    {
      method: "POST",
      headers: baseHeaders(tid, true),
      body: JSON.stringify(payload),
    }
  );
  return handleJson(res);
}

export type DocumentHistoryStatus = "active" | "replaced" | "deleted";

export interface DocumentHistoryEntry {
  version: number;
  document_id: string;
  status: DocumentHistoryStatus;
  created_at?: string | null;
  label?: string | null;
}

export interface DocumentHistoryResponse {
  versions: DocumentHistoryEntry[];
}

function normalizeStatusEntry(s: string): DocumentHistoryStatus {
  const u = s.toLowerCase();
  if (u === "active" || u === "replaced" || u === "deleted") return u;
  if (u === "removed" || u === "obsolete") return "replaced";
  return "active";
}

export async function getDocumentHistory(
  applicationId: string,
  tenantId: string
): Promise<DocumentHistoryResponse> {
  const tid = requireTenant(tenantId);
  const res = await fetch(
    `${APP_PREFIX(applicationId)}/documents/history`,
    { headers: baseHeaders(tid, false) }
  );
  const json = await handleJson<unknown>(res);
  const d = unwrap<Record<string, unknown>>(json) ?? (json as Record<string, unknown>) ?? {};
  const list =
    (Array.isArray(d.versions) && d.versions) ||
    (Array.isArray(d.items) && d.items) ||
    (Array.isArray(d.history) && d.history) ||
    (Array.isArray(json) ? (json as unknown[]) : []);

  const versions: DocumentHistoryEntry[] = (list as unknown[])
    .map((row, idx): DocumentHistoryEntry | null => {
      if (!row || typeof row !== "object") return null;
      const r = row as Record<string, unknown>;
      const docId = r.document_id ?? r.documentId ?? r.id;
      if (docId == null) return null;
      const ver =
        r.version != null
          ? Number(r.version)
          : r.version_number != null
            ? Number(r.version_number)
            : idx + 1;
      const st = r.status != null ? String(r.status) : "active";
      return {
        version: Number.isFinite(ver) ? ver : idx + 1,
        document_id: String(docId),
        status: normalizeStatusEntry(st),
        created_at:
          r.created_at != null
            ? String(r.created_at)
            : r.created != null
              ? String(r.created)
              : null,
        label: r.label != null ? String(r.label) : null,
      };
    })
    .filter((x): x is DocumentHistoryEntry => x != null);

  return { versions };
}

/** UX helpers */
export function extractionStatusLabel(status: ExtractionStatus): string {
  switch (status) {
    case "completed":
      return "Documento procesado";
    case "needs_review":
      return "Requiere revisión";
    case "failed":
      return "Error";
    case "processing":
      return "Procesando…";
    default:
      return "Pendiente";
  }
}

export function riskLevelIsHigh(level: string | null): boolean {
  if (!level) return false;
  const u = level.toUpperCase();
  return u === "HIGH" || u === "CRITICAL" || u === "ALTO" || u === "ELEVATED";
}

/**
 * Projects Core — client-side fetch helpers for /api/v1/proyectos/* (FastAPI).
 * Same auth shape as {@link lib/credit-api}: `X-Tenant-ID` + `Authorization: Bearer` from
 * {@link getAuthHeaders} (Auth V2 in-memory token, legacy `nadakki_sic_token` fallback).
 */

import { getAuthHeaders } from "@/lib/api/fetch-client";
import { assertResolvedApiPath, proyectoApiSuffix } from "@/lib/projects/proyectoApiPaths";

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
).replace(/\/$/, "");

const PROJECTS_BASE = `${BACKEND_URL}/api/v1/proyectos`;

export class ProyectosApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown
  ) {
    super(message);
    this.name = "ProyectosApiError";
  }
}

function proyectoHeaders(
  tenantId: string,
  opts?: { jsonBody?: boolean }
): HeadersInit {
  const h: Record<string, string> = {
    Accept: "application/json",
    "X-Tenant-ID": tenantId.trim(),
    ...getAuthHeaders(),
  };
  if (opts?.jsonBody !== false) {
    h["Content-Type"] = "application/json";
  }
  return h;
}

async function proyectoFetchUnknown(
  tenantId: string,
  pathSuffix: string,
  init?: Omit<RequestInit, "headers"> & { omitContentType?: boolean }
): Promise<unknown | null> {
  const method = (init?.method ?? "GET").toUpperCase();
  const hasBody = init?.body != null && method !== "GET" && method !== "HEAD";
  const omitJson = init?.omitContentType === true || !hasBody;
  const url = `${PROJECTS_BASE}${pathSuffix === "" ? "" : assertResolvedApiPath(pathSuffix)}`;
  const { omitContentType: _omit, ...restInit } = init ?? {};
  const res = await fetch(url, {
    ...restInit,
    headers: proyectoHeaders(tenantId, omitJson ? { jsonBody: false } : undefined),
    method: restInit.method ?? "GET",
    credentials: restInit.credentials ?? "include",
  });

  const textRaw = await res.text().catch(() => "");
  let parsed: unknown;
  try {
    parsed = textRaw ? JSON.parse(textRaw) : null;
  } catch {
    parsed = textRaw;
  }

  if (!res.ok) {
    throw new ProyectosApiError(
      `Projects API ${res.status}: ${typeof parsed === "string" ? parsed : textRaw || res.statusText}`,
      res.status,
      parsed
    );
  }
  return parsed;
}

/** GET /api/v1/proyectos */
export async function listProyectos(tenantId: string): Promise<unknown | null> {
  try {
    const out = await proyectoFetchUnknown(tenantId, "");
    return out ?? null;
  } catch {
    return null;
  }
}

/** GET /api/v1/proyectos/{id} — null on recoverable failures (parity with Credit getApplication). */
export async function getProyecto(tenantId: string, proyectoId: string): Promise<unknown | null> {
  try {
    return await proyectoFetchUnknown(tenantId, proyectoApiSuffix(proyectoId));
  } catch {
    return null;
  }
}

/** GET /api/v1/proyectos/{id}/master-plan */
export async function getMasterPlan(
  tenantId: string,
  proyectoId: string
): Promise<unknown | null> {
  return proyectoFetchUnknown(tenantId, proyectoApiSuffix(proyectoId, "master-plan"));
}

/** GET /api/v1/proyectos/{id}/escenarios */
export async function getEscenarios(
  tenantId: string,
  proyectoId: string
): Promise<unknown | null> {
  return proyectoFetchUnknown(tenantId, proyectoApiSuffix(proyectoId, "escenarios"));
}

/** GET /api/v1/proyectos/{id}/wbs */
export async function getWbs(tenantId: string, proyectoId: string): Promise<unknown | null> {
  return proyectoFetchUnknown(tenantId, proyectoApiSuffix(proyectoId, "wbs"));
}

/** GET /api/v1/proyectos/{id}/riesgos */
export async function getRiesgos(tenantId: string, proyectoId: string): Promise<unknown | null> {
  return proyectoFetchUnknown(tenantId, proyectoApiSuffix(proyectoId, "riesgos"));
}

/** GET /api/v1/proyectos/{id}/documentos */
export async function getDocumentos(
  tenantId: string,
  proyectoId: string
): Promise<unknown | null> {
  return proyectoFetchUnknown(tenantId, proyectoApiSuffix(proyectoId, "documentos"));
}

export interface DocumentoResponse {
  id: string;
  project_id: string;
  doc_type: string;
  doc_subtype?: string | null;
  filename_original: string;
  sha256_hash?: string;
  size_bytes: number;
  mime_type?: string;
  classification: string;
  version?: number;
  uploaded_at: string;
  uploaded_by?: string | null;
  [key: string]: unknown;
}

export interface CreateDocumentoMetadata {
  doc_type?: string;
  doc_subtype?: string;
  classification?: string;
  uploaded_by?: string;
}

function proyectoMultipartHeaders(tenantId: string): Record<string, string> {
  return {
    Accept: "application/json",
    "X-Tenant-ID": tenantId.trim(),
    ...getAuthHeaders(),
  };
}

/** POST /api/v1/proyectos/{proyecto_id}/documentos — multipart upload with progress. */
export async function createDocumento(
  tenantId: string,
  proyectoId: string,
  file: File,
  metadata: CreateDocumentoMetadata,
  onProgress?: (percent: number) => void,
): Promise<DocumentoResponse> {
  const formData = new FormData();
  formData.append("file", file);
  if (metadata.doc_type?.trim()) formData.append("doc_type", metadata.doc_type.trim());
  if (metadata.doc_subtype?.trim()) formData.append("doc_subtype", metadata.doc_subtype.trim());
  if (metadata.classification?.trim()) formData.append("classification", metadata.classification.trim());
  if (metadata.uploaded_by?.trim()) formData.append("uploaded_by", metadata.uploaded_by.trim());

  const url = `${PROJECTS_BASE}${proyectoApiSuffix(proyectoId, "documentos")}`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    const headers = proyectoMultipartHeaders(tenantId);
    for (const [key, value] of Object.entries(headers)) {
      if (value) xhr.setRequestHeader(key, value);
    }
    xhr.withCredentials = true;

    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && event.total > 0) {
          onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
        }
      };
    }

    xhr.onload = () => {
      const text = xhr.responseText ?? "";
      let parsed: unknown;
      try {
        parsed = text ? JSON.parse(text) : null;
      } catch {
        parsed = text;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(parsed as DocumentoResponse);
        return;
      }

      reject(
        new ProyectosApiError(
          typeof parsed === "string" ? parsed : text || xhr.statusText || "Upload failed",
          xhr.status,
          parsed,
        ),
      );
    };

    xhr.onerror = () => reject(new ProyectosApiError("Network error during upload", 0));
    xhr.onabort = () => reject(new ProyectosApiError("Upload cancelled", 0));
    xhr.send(formData);
  });
}

function filenameFromContentDisposition(header: string | null, fallback: string): string {
  if (!header) return fallback;
  const utf8 = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8?.[1]) {
    try {
      return decodeURIComponent(utf8[1].replace(/"/g, ""));
    } catch {
      return utf8[1];
    }
  }
  const plain = header.match(/filename="?([^";]+)"?/i);
  return plain?.[1]?.trim() || fallback;
}

/** GET /api/v1/proyectos/documentos/{documento_id}/download */
export async function downloadDocumento(
  tenantId: string,
  documentoId: string,
  filename: string,
): Promise<void> {
  const url = `${PROJECTS_BASE}/documentos/${encodeURIComponent(documentoId)}/download`;
  const res = await fetch(url, {
    method: "GET",
    headers: proyectoMultipartHeaders(tenantId),
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ProyectosApiError(text || res.statusText || "Download failed", res.status);
  }

  const blob = await res.blob();
  const name = filenameFromContentDisposition(res.headers.get("Content-Disposition"), filename);
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = name;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

/** DELETE /api/v1/proyectos/documentos/{documento_id} — soft delete */
export async function deleteDocumento(
  tenantId: string,
  documentoId: string,
): Promise<{ id: string; deleted_at: string }> {
  const url = `${PROJECTS_BASE}/documentos/${encodeURIComponent(documentoId)}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: proyectoMultipartHeaders(tenantId),
    credentials: "include",
  });

  const text = await res.text().catch(() => "");
  let parsed: unknown;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }

  if (res.status === 404) {
    throw new ProyectosApiError("Documento no encontrado o no pertenece a este tenant", 404, parsed);
  }

  if (!res.ok) {
    throw new ProyectosApiError(
      typeof parsed === "string" ? parsed : text || res.statusText || "Delete failed",
      res.status,
      parsed,
    );
  }

  const body = parsed as Record<string, unknown>;
  return {
    id: String(body.id ?? documentoId),
    deleted_at: String(body.deleted_at ?? new Date().toISOString()),
  };
}

/** GET /api/v1/proyectos/{id}/audit-trail */
export async function getAuditTrailProject(
  tenantId: string,
  proyectoId: string
): Promise<unknown | null> {
  return proyectoFetchUnknown(tenantId, proyectoApiSuffix(proyectoId, "audit-trail"));
}

/**
 * VERIFY audit trail (prueba rutas típicas /audit/verify y /audit-trail/verify).
 * Devuelve null si ninguna coincide con gateway.
 */
export async function verifyProyectosAuditTrail(
  tenantId: string,
  proyectoId: string
): Promise<unknown | null> {
  const paths = [
    proyectoApiSuffix(proyectoId, "audit", "verify"),
    proyectoApiSuffix(proyectoId, "audit-trail", "verify"),
  ];
  for (const p of paths) {
    try {
      return await proyectoFetchUnknown(tenantId, p);
    } catch {
      /* siguiente */
    }
  }
  return null;
}

/** GET /api/v1/proyectos/portafolio */
export async function getPortafolio(tenantId: string): Promise<unknown | null> {
  try {
    return await proyectoFetchUnknown(tenantId, "/portafolio");
  } catch {
    return null;
  }
}

/** ---- Mutaciones POST (mismo cliente fetch; payloads = NADAKKI YAML — verificar cuando el archivo esté en este repo). */

/**
 * POST /api/v1/proyectos — creación proyecto (`body` JSON tal cual espera gateway).
 */
export async function createProyecto(tenantId: string, body: Record<string, unknown>): Promise<unknown | null> {
  return proyectoFetchUnknown(tenantId, "", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * POST /api/v1/proyectos/{id}/state
 * SCHEMA body: pendiente YAML en-repo — función para cabler clientes cuando el payload esté definido aquí.
 */
export async function advanceState(
  tenantId: string,
  proyectoId: string,
  body: Record<string, unknown>
): Promise<unknown | null> {
  return proyectoFetchUnknown(tenantId, proyectoApiSuffix(proyectoId, "state"), {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * POST /api/v1/proyectos/{id}/charter
 * SCHEMA body: pendiente YAML en-repo.
 */
export async function createCharter(
  tenantId: string,
  proyectoId: string,
  body: Record<string, unknown>
): Promise<unknown | null> {
  return proyectoFetchUnknown(tenantId, proyectoApiSuffix(proyectoId, "charter"), {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * POST /api/v1/proyectos/{id}/terrenos
 * SCHEMA body: pendiente YAML en-repo (ruta según gateway producción).
 */
export async function createTerreno(
  tenantId: string,
  proyectoId: string,
  body: Record<string, unknown>
): Promise<unknown | null> {
  return proyectoFetchUnknown(tenantId, proyectoApiSuffix(proyectoId, "terrenos"), {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export interface ProyectoUpdatable {
  nombre?: string;
  codigo_interno?: string;
  sponsor_user_id?: string;
  pmo_director_user_id?: string;
  budget_envelope_usd?: number;
  budget_capex_usd?: number;
  budget_opex_usd?: number;
  fecha_inicio_target?: string;
  fecha_fin_target?: string;
  updated_by?: string;
}

export interface StateTransitionResponse {
  from_state?: string;
  to_state?: string;
  transition_allowed?: boolean;
  [key: string]: unknown;
}

function extractApiDetail(body: unknown, fallback: string): string {
  if (typeof body === "string" && body.trim()) return body;
  if (body && typeof body === "object") {
    const o = body as Record<string, unknown>;
    if (typeof o.detail === "string") return o.detail;
    if (o.detail) return JSON.stringify(o.detail);
    if (typeof o.message === "string") return o.message;
  }
  return fallback;
}

/** PATCH /api/v1/proyectos/{project_id} — partial update (COALESCE server-side). */
export async function updateProyecto(
  tenantId: string,
  proyectoId: string,
  updates: Partial<ProyectoUpdatable>,
): Promise<unknown> {
  const payload = { ...updates, updated_by: updates.updated_by ?? "dashboard-user" };
  const result = await proyectoFetchUnknown(tenantId, proyectoApiSuffix(proyectoId), {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  if (result === null) {
    throw new ProyectosApiError("Empty response from PATCH proyecto", 500);
  }
  return result;
}

/** POST /api/v1/proyectos/{project_id}/state — state machine transition. */
export async function transitionProyectoState(
  tenantId: string,
  proyectoId: string,
  targetState: string,
  justification: string,
): Promise<StateTransitionResponse> {
  const result = await proyectoFetchUnknown(tenantId, proyectoApiSuffix(proyectoId, "state"), {
    method: "POST",
    body: JSON.stringify({
      target_state: targetState,
      justification: justification.trim(),
      actor_id: "dashboard-user",
    }),
  });
  return (result ?? {}) as StateTransitionResponse;
}

/** DELETE /api/v1/proyectos/{project_id} — soft delete (204 No Content). */
export async function deleteProyecto(tenantId: string, proyectoId: string): Promise<void> {
  const url = `${PROJECTS_BASE}${proyectoApiSuffix(proyectoId)}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: proyectoHeaders(tenantId, { jsonBody: false }),
    credentials: "include",
  });

  if (res.status === 204) return;

  const text = await res.text().catch(() => "");
  let parsed: unknown;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }

  if (res.status === 404) {
    throw new ProyectosApiError("Proyecto no encontrado o ya eliminado", 404, parsed);
  }
  if (res.status === 409) {
    throw new ProyectosApiError(
      extractApiDetail(parsed, "Estado no permite soft delete"),
      409,
      parsed,
    );
  }

  if (!res.ok) {
    throw new ProyectosApiError(extractApiDetail(parsed, res.statusText || "Delete failed"), res.status, parsed);
  }
}

// --- Finanzas (Fase 2) — facturas/pagos/eventos → production API; cotizaciones/OC → mocks (WS-B) ---
export {
  FinanzasApiError,
  listContratistas,
  type Contratista,
  getFinanceOverview,
  getBudget,
  getBudgetVariance,
  updateBudget,
  listFacturas,
  getFactura,
  createFactura,
  updateFactura,
  approveFactura,
  rejectFactura,
  deleteFactura,
  listCotizaciones,
  getCotizacion,
  createCotizacion,
  updateCotizacion,
  approveCotizacion,
  rejectCotizacion,
  convertCotizacionToPO,
  deleteCotizacion,
  listOrdenesCompra,
  getOrdenCompra,
  createOrdenCompra,
  updateOrdenCompra,
  issueOrdenCompra,
  cancelOrdenCompra,
  closeOrdenCompra,
  deleteOrdenCompra,
  listPagos,
  getPago,
  createPago,
  updatePago,
  confirmPago,
  reversePago,
  deletePago,
  listDeals,
  getDeal,
  createDeal,
  updateDeal,
  closeDeal,
  deleteDeal,
  listEventosEconomicos,
  getEventoEconomico,
} from "./proyectosFinanzas";

/**
 * Hearings API client.
 *
 * Uses the EXISTING legal convention of the dashboard: a same-origin Next.js
 * rewrite proxy `/api/legal/*` (next.config.js → `${backendUrl}/api/v1/legal/*`)
 * with the `X-Tenant-ID` header. This mirrors lib/legal/cases/legal-cases-api.ts.
 *
 * SECURITY NOTE (inherited, not introduced here): X-Tenant-ID is the de-facto
 * tenant mechanism at runtime today because the backend runs with RLS bypass.
 * Real tenant isolation (RLS + JWT-tenant) activates with the PENDING platform
 * cutover. This UI inherits the existing legal pattern; it does NOT certify that
 * the backend is already the tenant/RBAC authority.
 *
 * Owner: frontend / legal. Task: SUPERLOOP MAESTRO v2 — hearings calendar UI.
 */

import type {
  HearingConfigResponse,
  HearingCreatePayload,
  HearingKPIs,
  HearingListFilters,
  HearingListResponse,
  HearingOut,
  HearingStatusPatchBody,
} from "@/lib/legal/hearings/hearings-types";

const LEGAL_PREFIX = "/api/legal";
const HEARINGS_BASE = `${LEGAL_PREFIX}/hearings`;

/** Typed error so the UI can map HTTP status → user-facing message. */
export class HearingsApiError extends Error {
  readonly status: number;
  readonly detail: unknown;

  constructor(message: string, status: number, detail?: unknown) {
    super(message);
    this.name = "HearingsApiError";
    this.status = status;
    this.detail = detail;
  }
}

function tenantHeaders(tenantId: string): Record<string, string> {
  return {
    "X-Tenant-ID": tenantId.trim(),
    Accept: "application/json",
  };
}

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

/** Pull a human message out of a FastAPI error body ({detail: str | [{msg}]}). */
function extractDetailMessage(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return null;
  const detail = (raw as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const msgs = detail
      .map((d) => (d && typeof d === "object" ? (d as { msg?: unknown }).msg : null))
      .filter((m): m is string => typeof m === "string");
    if (msgs.length) return msgs.join("; ");
  }
  return null;
}

function fallbackMessage(status: number): string {
  switch (status) {
    case 401:
      return "Tu sesión expiró. Inicia sesión nuevamente.";
    case 403:
      return "No tienes permiso para gestionar audiencias.";
    case 409:
      return "Ya existe una audiencia con esa referencia externa (external_ref).";
    case 422:
      return "Datos inválidos. Revisa los campos.";
    case 500:
      return "Error inesperado en el servidor. Inténtalo de nuevo.";
    default:
      return `Error al procesar la solicitud (${status}).`;
  }
}

async function request<T>(
  url: string,
  tenantId: string,
  init: RequestInit = {},
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: { ...tenantHeaders(tenantId), ...(init.headers ?? {}) },
    });
  } catch (cause) {
    // Network / CORS / backend down — no HTTP status available.
    throw new HearingsApiError("El backend no está disponible. Inténtalo más tarde.", 0, cause);
  }

  if (!res.ok) {
    let raw: unknown = null;
    try {
      raw = JSON.parse(await res.text());
    } catch {
      raw = null;
    }
    const backendMsg = extractDetailMessage(raw);
    // For 409/422 prefer the backend's own message (it explains the conflict/validation).
    const message =
      (res.status === 409 || res.status === 422) && backendMsg
        ? backendMsg
        : fallbackMessage(res.status);
    throw new HearingsApiError(message, res.status, raw);
  }

  return parseJson<T>(res);
}

function buildQuery(filters: HearingListFilters): string {
  const q = new URLSearchParams();
  const entries: [string, string | number | undefined][] = [
    ["from", filters.from],
    ["to", filters.to],
    ["case_id", filters.case_id],
    ["status", filters.status],
    ["hearing_type", filters.hearing_type],
    ["limit", filters.limit],
    ["offset", filters.offset],
  ];
  for (const [k, v] of entries) {
    if (v !== undefined && v !== null && `${v}` !== "") q.set(k, String(v));
  }
  const qs = q.toString();
  return qs ? `?${qs}` : "";
}

/** GET /api/v1/legal/hearings/config */
export async function getHearingConfig(tenantId: string): Promise<HearingConfigResponse> {
  return request<HearingConfigResponse>(`${HEARINGS_BASE}/config`, tenantId);
}

/** GET /api/v1/legal/hearings/kpis (no query params per spec) */
export async function getHearingKpis(tenantId: string): Promise<HearingKPIs> {
  return request<HearingKPIs>(`${HEARINGS_BASE}/kpis`, tenantId);
}

/** GET /api/v1/legal/hearings?from&to&case_id&status&hearing_type&limit&offset */
export async function listHearings(
  tenantId: string,
  filters: HearingListFilters = {},
): Promise<HearingListResponse> {
  const raw = await request<unknown>(`${HEARINGS_BASE}${buildQuery(filters)}`, tenantId);
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const hearings = Array.isArray(o.hearings) ? (o.hearings as HearingOut[]) : [];
  const total = typeof o.total === "number" ? o.total : hearings.length;
  return { hearings, total };
}

/** GET /api/v1/legal/hearings/{hearing_id} */
export async function getHearing(tenantId: string, hearingId: string): Promise<HearingOut> {
  return request<HearingOut>(
    `${HEARINGS_BASE}/${encodeURIComponent(hearingId)}`,
    tenantId,
  );
}

/** POST /api/v1/legal/hearings → 201 HearingOut (tenant_id is NEVER in the body). */
export async function createHearing(
  tenantId: string,
  payload: HearingCreatePayload,
): Promise<HearingOut> {
  return request<HearingOut>(HEARINGS_BASE, tenantId, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/** PATCH /api/v1/legal/hearings/{hearing_id}/status → HearingOut (transitions validated by backend). */
export async function patchHearingStatus(
  tenantId: string,
  hearingId: string,
  body: HearingStatusPatchBody,
): Promise<HearingOut> {
  return request<HearingOut>(
    `${HEARINGS_BASE}/${encodeURIComponent(hearingId)}/status`,
    tenantId,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

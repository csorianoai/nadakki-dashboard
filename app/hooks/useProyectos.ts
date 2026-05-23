/**
 * Projects Core — client-side fetch helpers for /api/v1/proyectos/* (FastAPI).
 * Same auth shape as {@link lib/credit-api}: `X-Tenant-ID` + `Authorization: Bearer` from
 * {@link getAuthHeaders} (Auth V2 in-memory token, legacy `nadakki_sic_token` fallback).
 */

import { getAuthHeaders } from "@/lib/api/fetch-client";

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

function encodeId(id: string): string {
  return encodeURIComponent(id);
}

async function proyectoFetchUnknown(
  tenantId: string,
  pathSuffix: string,
  init?: Omit<RequestInit, "headers"> & { omitContentType?: boolean }
): Promise<unknown | null> {
  const method = (init?.method ?? "GET").toUpperCase();
  const hasBody = init?.body != null && method !== "GET" && method !== "HEAD";
  const omitJson = init?.omitContentType === true || !hasBody;
  const url = `${PROJECTS_BASE}${pathSuffix}`;
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
    return await proyectoFetchUnknown(tenantId, `/${encodeId(proyectoId)}`);
  } catch {
    return null;
  }
}

/** GET /api/v1/proyectos/{id}/master-plan */
export async function getMasterPlan(
  tenantId: string,
  proyectoId: string
): Promise<unknown | null> {
  return proyectoFetchUnknown(tenantId, `/${encodeId(proyectoId)}/master-plan`);
}

/** GET /api/v1/proyectos/{id}/escenarios */
export async function getEscenarios(
  tenantId: string,
  proyectoId: string
): Promise<unknown | null> {
  return proyectoFetchUnknown(tenantId, `/${encodeId(proyectoId)}/escenarios`);
}

/** GET /api/v1/proyectos/{id}/wbs */
export async function getWbs(tenantId: string, proyectoId: string): Promise<unknown | null> {
  return proyectoFetchUnknown(tenantId, `/${encodeId(proyectoId)}/wbs`);
}

/** GET /api/v1/proyectos/{id}/riesgos */
export async function getRiesgos(tenantId: string, proyectoId: string): Promise<unknown | null> {
  return proyectoFetchUnknown(tenantId, `/${encodeId(proyectoId)}/riesgos`);
}

/** GET /api/v1/proyectos/{id}/documentos */
export async function getDocumentos(
  tenantId: string,
  proyectoId: string
): Promise<unknown | null> {
  return proyectoFetchUnknown(tenantId, `/${encodeId(proyectoId)}/documentos`);
}

/** GET /api/v1/proyectos/{id}/audit-trail */
export async function getAuditTrailProject(
  tenantId: string,
  proyectoId: string
): Promise<unknown | null> {
  return proyectoFetchUnknown(tenantId, `/${encodeId(proyectoId)}/audit-trail`);
}

/**
 * VERIFY audit trail (prueba rutas típicas /audit/verify y /audit-trail/verify).
 * Devuelve null si ninguna coincide con gateway.
 */
export async function verifyProyectosAuditTrail(
  tenantId: string,
  proyectoId: string
): Promise<unknown | null> {
  const paths = [`/${encodeId(proyectoId)}/audit/verify`, `/${encodeId(proyectoId)}/audit-trail/verify`];
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
  return proyectoFetchUnknown(tenantId, `/${encodeId(proyectoId)}/state`, {
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
  return proyectoFetchUnknown(tenantId, `/${encodeId(proyectoId)}/charter`, {
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
  return proyectoFetchUnknown(tenantId, `/${encodeId(proyectoId)}/terrenos`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

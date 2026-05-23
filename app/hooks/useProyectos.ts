/**
 * Projects Core — client-side fetch helpers for /api/v1/proyectos/* (FastAPI).
 * Pattern mirrors {@link "@/app/hooks/useCredit"}: direct BACKEND_URL + JSON + X-Tenant-ID (no silent defaults — caller passes tenant from TenantContext).
 */

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
    "X-Tenant-ID": tenantId,
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
  const omitJson = init?.omitContentType === true;
  const url = `${PROJECTS_BASE}${pathSuffix}`;
  const { omitContentType: _omit, ...restInit } = init ?? {};
  const res = await fetch(url, {
    ...restInit,
    headers: proyectoHeaders(tenantId, omitJson ? { jsonBody: false } : undefined),
    method: restInit.method ?? "GET",
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

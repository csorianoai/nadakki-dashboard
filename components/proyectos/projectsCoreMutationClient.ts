/**
 * POST mutaciones Projects Core desde UI Fase 1.
 * Replica cabeceras de {@link app/hooks/useProyectos} sin modificar ese módulo.
 */
import { getAuthHeaders } from "@/lib/api/fetch-client";

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");
const PROJECTS_BASE = `${BACKEND_URL}/api/v1/proyectos`;

export class ProjectsCoreMutationError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "ProjectsCoreMutationError";
  }
}

function encodeId(id: string): string {
  return encodeURIComponent(id);
}

function headers(tenantId: string): HeadersInit {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Tenant-ID": tenantId.trim(),
    ...getAuthHeaders(),
  };
}

async function parseBody(res: Response): Promise<unknown> {
  const textRaw = await res.text().catch(() => "");
  if (!textRaw) return null;
  try {
    return JSON.parse(textRaw) as unknown;
  } catch {
    return textRaw;
  }
}

/**
 * POST bajo colección proyecto (suffix con leading slash ej. `/id/wbs`).
 */
export async function projectsCorePost(
  tenantId: string,
  pathSuffix: string,
  jsonBody: Record<string, unknown>,
): Promise<unknown> {
  const url = `${PROJECTS_BASE}${pathSuffix}`;
  const res = await fetch(url, {
    method: "POST",
    headers: headers(tenantId),
    body: JSON.stringify(jsonBody),
    credentials: "include",
  });
  const body = await parseBody(res);

  if (!res.ok) {
    const detail =
      typeof body === "string"
        ? body
        : body && typeof body === "object" && "detail" in body
          ? JSON.stringify((body as Record<string, unknown>).detail)
          : typeof body === "object"
            ? JSON.stringify(body)
            : res.statusText;
    throw new ProjectsCoreMutationError(`Projects POST ${res.status}: ${detail}`, res.status, body);
  }

  return body;
}

/** POST crear ítem WBS — cuerpo sujeto contrato YAML; snake_case habitual FastAPI español */
export async function createWbsItem(
  tenantId: string,
  proyectoId: string,
  payload: Record<string, unknown>,
): Promise<unknown> {
  return projectsCorePost(tenantId, `/${encodeId(proyectoId)}/wbs`, payload);
}

/** POST crear riesgo */
export async function createProyectoRiesgo(
  tenantId: string,
  proyectoId: string,
  payload: Record<string, unknown>,
): Promise<unknown> {
  return projectsCorePost(tenantId, `/${encodeId(proyectoId)}/riesgos`, payload);
}

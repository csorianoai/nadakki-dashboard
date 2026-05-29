/**
 * POST mutaciones Projects Core desde UI Fase 1.
 * Replica cabeceras de {@link app/hooks/useProyectos} sin modificar ese módulo.
 */
import { getAuthHeaders } from "@/lib/api/fetch-client";
import { assertResolvedApiPath, proyectoApiSuffix } from "@/lib/projects/proyectoApiPaths";

const PROJECTS_BASE = "/api/v1/proyectos";

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
 * POST bajo colección proyecto.
 * Prefer {@link proyectoApiSuffix} for path construction — rejects unresolved `{id}` placeholders.
 */
export async function projectsCorePost(
  tenantId: string,
  pathSuffix: string,
  jsonBody: Record<string, unknown>,
): Promise<unknown> {
  let resolvedPath: string;
  try {
    resolvedPath = assertResolvedApiPath(pathSuffix);
  } catch (error) {
    throw new ProjectsCoreMutationError(
      error instanceof Error ? error.message : "Invalid Projects API path",
      0,
    );
  }

  const url = `${PROJECTS_BASE}${resolvedPath}`;
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
  return projectsCorePost(tenantId, proyectoApiSuffix(proyectoId, "wbs"), payload);
}

/** POST crear riesgo */
export async function createProyectoRiesgo(
  tenantId: string,
  proyectoId: string,
  payload: Record<string, unknown>,
): Promise<unknown> {
  return projectsCorePost(tenantId, proyectoApiSuffix(proyectoId, "riesgos"), payload);
}

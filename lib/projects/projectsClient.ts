import { getAuthHeaders } from "@/lib/api/fetch-client";
import { assertResolvedApiPath, proyectoApiSuffix } from "@/lib/projects/proyectoApiPaths";
import type { AuditTrailEntry, CreateProyectoPayload, Proyecto, ProyectoDocumentStub } from "./types";

export const PROJECTS_BASE = "/api/v1/proyectos";
const REQUEST_TIMEOUT_MS = 30_000;

export class ProjectsApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public detail?: unknown
  ) {
    super(message);
    this.name = "ProjectsApiError";
  }
}

async function parseResponseBody(response: Response): Promise<unknown> {
  try {
    return await response.clone().json();
  } catch {
    try {
      return await response.text();
    } catch {
      return null;
    }
  }
}

function responseMessage(body: unknown, fallback: string): string {
  if (typeof body === "string" && body.trim()) return body;
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    if (typeof record.message === "string") return record.message;
    if (typeof record.error === "string") return record.error;
    if (typeof record.detail === "string") return record.detail;
    if (record.detail) return JSON.stringify(record.detail);
  }
  return fallback || "Projects API request failed";
}

interface ProjectsRequestInit extends Omit<RequestInit, "headers"> {
  tenantId: string;
  headers?: Record<string, string>;
}

function numOrUndefined(v: unknown): number | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v.replace(",", "."));
    return Number.isNaN(n) ? undefined : n;
  }
  return undefined;
}

function normalizeDocuments(raw: unknown): ProyectoDocumentStub[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const docs: ProyectoDocumentStub[] = [];
  for (const d of raw) {
    if (!d || typeof d !== "object") continue;
    const o = d as Record<string, unknown>;
    docs.push({
      id: typeof o.id === "string" ? o.id : undefined,
      label: typeof o.label === "string" ? o.label : undefined,
      name: typeof o.name === "string" ? o.name : undefined,
    });
  }
  return docs.length ? docs : undefined;
}

function normalizeProyecto(raw: unknown): Proyecto {
  if (!raw || typeof raw !== "object") {
    return { id: String(raw ?? "") };
  }
  const o = raw as Record<string, unknown>;
  const viability = numOrUndefined(o.viability_score);
  const risk = numOrUndefined(o.risk_score);
  const budget = numOrUndefined(
    o.preliminary_budget_minor_units ?? o.preliminary_budget ?? o.budget_minor_units
  );
  const documents = normalizeDocuments((o.documents ?? o.attachments) as unknown);
  const project_type =
    typeof o.project_type === "string"
      ? o.project_type
      : typeof o.type === "string"
        ? o.type
        : undefined;

  return {
    id: String(o.id ?? o.uuid ?? o.proyecto_id ?? o.project_id ?? ""),
    name: typeof o.name === "string" ? o.name : (o.title as string) ?? null,
    title: typeof o.title === "string" ? o.title : undefined,
    state: typeof o.state === "string" ? o.state : undefined,
    description: typeof o.description === "string" ? o.description : undefined,
    created_at: typeof o.created_at === "string" ? o.created_at : undefined,
    updated_at: typeof o.updated_at === "string" ? o.updated_at : undefined,
    project_type,
    methodology_pack: typeof o.methodology_pack === "string" ? o.methodology_pack : undefined,
    viability_score: viability,
    risk_score: risk,
    preliminary_budget_minor_units: budget,
    budget_currency: typeof o.budget_currency === "string" ? o.budget_currency : undefined,
    documents,
  };
}

function normalizeProyectos(raw: unknown): Proyecto[] {
  if (Array.isArray(raw)) return raw.map(normalizeProyecto);
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const list = (o.items ?? o.data ?? o.proyectos ?? o.results) as unknown;
    if (Array.isArray(list)) return list.map(normalizeProyecto);
  }
  return [];
}

function normalizeAudit(raw: unknown): AuditTrailEntry[] {
  if (Array.isArray(raw)) {
    return raw.map((entry) =>
      entry && typeof entry === "object" ? (entry as AuditTrailEntry) : { detail: {} }
    );
  }
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const list = (o.items ?? o.entries ?? o.results) as unknown;
    if (Array.isArray(list)) {
      return list.map((entry) =>
        entry && typeof entry === "object" ? (entry as AuditTrailEntry) : { detail: {} }
      );
    }
  }
  return [];
}

async function projectsFetch<T>(path: string, init: ProjectsRequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const method = (init.method ?? "GET").toUpperCase();
    const hasJsonBody = Boolean(init.body) && method !== "GET" && method !== "HEAD";
    const baseHeaders: Record<string, string> = {
      Accept: "application/json",
      "X-Tenant-ID": init.tenantId.trim(),
      ...getAuthHeaders(),
      ...(init.headers ?? {}),
    };
    if (hasJsonBody) {
      baseHeaders["Content-Type"] = "application/json";
    }

    const response = await fetch(`${PROJECTS_BASE}${path === "" ? "" : assertResolvedApiPath(path)}`, {
      ...init,
      headers: baseHeaders,
      signal: controller.signal,
      credentials: init.credentials ?? "include",
    });
    const body = await parseResponseBody(response);

    if (!response.ok) {
      throw new ProjectsApiError(responseMessage(body, response.statusText), response.status, body);
    }

    return body as T;
  } catch (error) {
    if (error instanceof ProjectsApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ProjectsApiError("Projects API request timed out", 408);
    }
    throw new ProjectsApiError(error instanceof Error ? error.message : "Projects API request failed", 0, error);
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function listProyectos(params: {
  tenantId: string;
  /** Optional query suffix e.g. `?page=1&size=20` — contract TBD */
  query?: string;
}): Promise<Proyecto[]> {
  const q = params.query ?? "";
  const raw = await projectsFetch<unknown>(`${q}`, {
    method: "GET",
    tenantId: params.tenantId,
  });
  return normalizeProyectos(raw);
}

export async function createProyecto(params: {
  tenantId: string;
  payload: CreateProyectoPayload;
}): Promise<Proyecto> {
  const raw = await projectsFetch<unknown>("", {
    method: "POST",
    tenantId: params.tenantId,
    body: JSON.stringify(params.payload),
  });
  if (raw && typeof raw === "object" && "data" in raw && (raw as Record<string, unknown>).data !== undefined) {
    return normalizeProyecto((raw as Record<string, unknown>).data);
  }
  return normalizeProyecto(raw);
}

export async function getProyecto(params: { tenantId: string; id: string }): Promise<Proyecto> {
  const raw = await projectsFetch<unknown>(proyectoApiSuffix(params.id), {
    method: "GET",
    tenantId: params.tenantId,
  });
  if (raw && typeof raw === "object" && "data" in raw && (raw as Record<string, unknown>).data !== undefined) {
    return normalizeProyecto((raw as Record<string, unknown>).data);
  }
  return normalizeProyecto(raw);
}

export async function getHealth(params: { tenantId: string }): Promise<unknown> {
  return projectsFetch("/health", {
    method: "GET",
    tenantId: params.tenantId,
  });
}

export async function getAuditTrail(params: {
  tenantId: string;
  proyectoId: string;
}): Promise<AuditTrailEntry[]> {
  const raw = await projectsFetch<unknown>(
    proyectoApiSuffix(params.proyectoId, "audit-trail"),
    {
      method: "GET",
      tenantId: params.tenantId,
    }
  );
  return normalizeAudit(raw);
}

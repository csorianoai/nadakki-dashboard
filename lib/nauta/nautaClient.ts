/**
 * Nauta API client — production backend (Render).
 * Uses apiFetch (JWT Bearer) + X-Tenant-ID — same auth pattern as Credit Hub.
 *
 * Bypasses Next.js /api/v1 BFF catch-all (blocks paths containing "/run").
 * Requests go to NEXT_PUBLIC_API_URL + /api/v1/nauta/*.
 */
import { apiFetch } from "@/lib/api/fetch-client";
import {
  normalizeEmployees,
  normalizeEvidenceList,
  normalizeRunDetail,
  normalizeRunsList,
  normalizeTemplates,
} from "./normalizers";
import type {
  NautaApproveResponse,
  NautaEmployee,
  NautaEvidence,
  NautaHealthResponse,
  NautaRunDetail,
  NautaRunsListResponse,
  NautaTemplate,
} from "./types";

const NAUTA_PREFIX = "/api/v1/nauta";
const REQUEST_TIMEOUT_MS = 30_000;

export class NautaApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public detail?: unknown,
  ) {
    super(message);
    this.name = "NautaApiError";
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
    if (typeof record.detail === "string") return record.detail;
    if (typeof record.message === "string") return record.message;
    if (typeof record.error === "string") return record.error;
  }
  return fallback;
}

interface NautaRequestInit extends Omit<RequestInit, "headers"> {
  tenantId: string;
  headers?: Record<string, string>;
}

async function nautaFetch<T>(path: string, init: NautaRequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "X-Tenant-ID": init.tenantId,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers ?? {}),
    };

    const response = await apiFetch(`${NAUTA_PREFIX}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
      credentials: "include",
    });
    const body = await parseResponseBody(response);

    if (!response.ok) {
      throw new NautaApiError(responseMessage(body, response.statusText), response.status, body);
    }

    return body as T;
  } catch (error) {
    if (error instanceof NautaApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new NautaApiError("Nauta request timed out", 408);
    }
    throw new NautaApiError(error instanceof Error ? error.message : "Nauta request failed", 0, error);
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function getHealth(params: { tenantId: string }): Promise<NautaHealthResponse> {
  const raw = await nautaFetch<unknown>("/health", { tenantId: params.tenantId, method: "GET" });
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return { status: typeof o.status === "string" ? o.status : "ok" };
}

export async function getEmployees(params: { tenantId: string }): Promise<NautaEmployee[]> {
  const raw = await nautaFetch<unknown>("/employees", { tenantId: params.tenantId, method: "GET" });
  return normalizeEmployees(raw);
}

export async function getTemplates(params: { tenantId: string }): Promise<NautaTemplate[]> {
  const raw = await nautaFetch<unknown>("/templates", { tenantId: params.tenantId, method: "GET" });
  return normalizeTemplates(raw);
}

export async function getRuns(params: {
  tenantId: string;
  page?: number;
  limit?: number;
}): Promise<NautaRunsListResponse> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const q = new URLSearchParams();
  q.set("page", String(page));
  q.set("limit", String(limit));
  const raw = await nautaFetch<unknown>(`/runs?${q.toString()}`, {
    tenantId: params.tenantId,
    method: "GET",
  });
  return normalizeRunsList(raw, page);
}

export async function getRun(params: { tenantId: string; runId: string }): Promise<NautaRunDetail> {
  const raw = await nautaFetch<unknown>(`/runs/${encodeURIComponent(params.runId)}`, {
    tenantId: params.tenantId,
    method: "GET",
  });
  const detail = normalizeRunDetail(raw);
  if (!detail) throw new NautaApiError("Invalid run response", 502);
  return detail;
}

export async function getEvidence(params: {
  tenantId: string;
  runId: string;
}): Promise<NautaEvidence[]> {
  const raw = await nautaFetch<unknown>(`/runs/${encodeURIComponent(params.runId)}/evidence`, {
    tenantId: params.tenantId,
    method: "GET",
  });
  return normalizeEvidenceList(raw);
}

export interface CreateRunPayload {
  template_id: string;
  employee_id?: string;
  /** Default true — simulate/dry-run until live execution is approved. */
  dry_run?: boolean;
  mode?: "simulate" | "live";
  task_name?: string;
}

export async function createRun(params: {
  tenantId: string;
  body: CreateRunPayload;
}): Promise<NautaRunDetail> {
  const payload = {
    ...params.body,
    dry_run: params.body.dry_run ?? true,
    mode: params.body.mode ?? "simulate",
  };
  const raw = await nautaFetch<unknown>("/runs", {
    tenantId: params.tenantId,
    method: "POST",
    body: JSON.stringify(payload),
  });
  const detail = normalizeRunDetail(raw);
  if (!detail) throw new NautaApiError("Invalid create run response", 502);
  return detail;
}

export async function approveRun(params: {
  tenantId: string;
  runId: string;
}): Promise<NautaApproveResponse> {
  return nautaFetch<NautaApproveResponse>(`/runs/${encodeURIComponent(params.runId)}/approve`, {
    tenantId: params.tenantId,
    method: "POST",
    body: JSON.stringify({}),
  });
}

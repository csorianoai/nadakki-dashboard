/**
 * Nauta API client — production backend (Render).
 * Uses apiFetch (JWT Bearer only) — tenant derived from JWT (same as liveRunClient).
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
  NautaDashboardSummary,
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
  headers?: Record<string, string>;
}

async function nautaFetch<T>(path: string, init: NautaRequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const headers: Record<string, string> = {
      Accept: "application/json",
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

export async function getHealth(): Promise<NautaHealthResponse> {
  const raw = await nautaFetch<unknown>("/health", { method: "GET" });
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return { status: typeof o.status === "string" ? o.status : "ok" };
}

export async function getEmployees(): Promise<NautaEmployee[]> {
  const raw = await nautaFetch<unknown>("/employees", { method: "GET" });
  return normalizeEmployees(raw);
}

export async function getTemplates(): Promise<NautaTemplate[]> {
  const raw = await nautaFetch<unknown>("/templates", { method: "GET" });
  return normalizeTemplates(raw);
}

export async function getDashboardSummary(): Promise<NautaDashboardSummary> {
  const raw = await nautaFetch<unknown>("/dashboard/summary", { method: "GET" });
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const num = (v: unknown, fb = 0) => {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : fb;
  };
  return {
    total_runs: num(o.total_runs),
    success_rate: num(o.success_rate),
    cost_usd_month: num(o.cost_usd_month),
    hours_saved: num(o.hours_saved, 3940),
    pending_approvals: num(o.pending_approvals, 7),
  };
}

export async function getRuns(params?: { page?: number; limit?: number }): Promise<NautaRunsListResponse> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  const q = new URLSearchParams();
  q.set("page", String(page));
  q.set("limit", String(limit));
  const raw = await nautaFetch<unknown>(`/runs?${q.toString()}`, { method: "GET" });
  return normalizeRunsList(raw, page);
}

export async function getRun(params: { runId: string }): Promise<NautaRunDetail> {
  const raw = await nautaFetch<unknown>(`/runs/${encodeURIComponent(params.runId)}`, { method: "GET" });
  const detail = normalizeRunDetail(raw);
  if (!detail) throw new NautaApiError("Invalid run response", 502);
  return detail;
}

export async function getEvidence(params: { runId: string }): Promise<NautaEvidence[]> {
  const raw = await nautaFetch<unknown>(`/runs/${encodeURIComponent(params.runId)}/evidence`, {
    method: "GET",
  });
  return normalizeEvidenceList(raw);
}

export interface CreateRunPayload {
  /** Backend expects task_name slug (e.g. platform_auditor_smoke_test), NOT template_id. */
  task_name: string;
  mode?: "simulate" | "live";
  employee_id?: string;
}

export async function createRun(body: CreateRunPayload): Promise<NautaRunDetail> {
  const payload = {
    task_name: body.task_name,
    mode: body.mode ?? "simulate",
    ...(body.employee_id ? { employee_id: body.employee_id } : {}),
  };
  const raw = await nautaFetch<unknown>("/runs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const detail = normalizeRunDetail(raw);
  if (!detail) throw new NautaApiError("Invalid create run response", 502);
  return detail;
}

export async function approveRun(params: { runId: string }): Promise<NautaApproveResponse> {
  return nautaFetch<NautaApproveResponse>(`/runs/${encodeURIComponent(params.runId)}/approve`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

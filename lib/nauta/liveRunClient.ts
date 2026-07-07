/**
 * Nauta Fase C-LIVE — POST/GET /api/v1/nauta/runs via apiFetch (Bearer JWT only).
 * Contract: nadakki-ai-suite docs/NAUTA_FASE_C_LIVE_REPORTE.md + feat/nauta-freeform-e16
 */
import { apiFetch } from "@/lib/api/fetch-client";
import type { NautaRunArtifacts } from "./types";

const NAUTA_RUNS = "/api/v1/nauta/runs";

export type NautaLiveEngineRequested = "auto" | "browser_use" | "stagehand" | "cloud";

export interface NautaLiveRunCreateBody {
  task_name: string;
  mode: "live";
  engine_requested?: NautaLiveEngineRequested;
  target_url?: string;
  task_instruction?: string;
  dry_run: false;
}

export interface NautaLiveRunCreateResponse {
  id: string;
  status: string;
  mode: string;
  task_name?: string;
  engine_used?: string;
  poll_url?: string;
  live_view_url?: string | null;
}

export interface NautaLivePollResponse {
  id: string;
  status: "running" | "completed" | "failed" | "blocked" | "pending_approval" | string;
  success?: boolean | null;
  exit_code?: number | null;
  failure_cause?: string | null;
  outcome_category?: string | null;
  engine_used?: string | null;
  duration_seconds?: number;
  estimated_tokens?: number;
  estimated_cost_usd?: number;
  findings_count?: number;
  live_view_url?: string | null;
  evidence?: unknown[];
  artifacts?: NautaRunArtifacts | null;
}

function extractDetailString(body: unknown): string {
  if (typeof body === "string" && body.trim()) return body;
  if (!body || typeof body !== "object") return "";
  const o = body as Record<string, unknown>;
  if (typeof o.detail === "string") return o.detail;
  if (Array.isArray(o.detail)) {
    const parts = o.detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const row = item as Record<string, unknown>;
          if (typeof row.msg === "string") return row.msg;
          if (typeof row.type === "string") return row.type;
        }
        return "";
      })
      .filter(Boolean);
    return parts.join("; ");
  }
  if (typeof o.message === "string") return o.message;
  return "";
}

export class NautaLiveRunError extends Error {
  constructor(
    message: string,
    public status: number,
    public detail: string,
  ) {
    super(message);
    this.name = "NautaLiveRunError";
  }
}

export async function createLiveRun(body: NautaLiveRunCreateBody): Promise<NautaLiveRunCreateResponse> {
  const response = await apiFetch(NAUTA_RUNS, {
    method: "POST",
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as NautaLiveRunCreateResponse & { detail?: unknown };
  if (!response.ok) {
    const detail = extractDetailString(data);
    throw new NautaLiveRunError(detail || response.statusText, response.status, detail);
  }
  return data;
}

export async function pollLiveRun(runId: string): Promise<NautaLivePollResponse> {
  const response = await apiFetch(`${NAUTA_RUNS}/${encodeURIComponent(runId)}`, {
    method: "GET",
  });
  const data = (await response.json().catch(() => ({}))) as NautaLivePollResponse & { detail?: unknown };
  if (!response.ok) {
    const detail = extractDetailString(data);
    throw new NautaLiveRunError(detail || response.statusText, response.status, detail);
  }
  return data;
}

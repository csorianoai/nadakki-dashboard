/**
 * Google Ads Agent operational checks — proxied via next.config:
 * `/api/v1/ops/:path*` → backend `/api/v1/ops/:path*`
 */

import { type SuiteResult } from "@/lib/api/suiteOps";

const BASE = "";
const PREFIX = "/api/v1/ops/google-ads-agent/checks";

export type GoogleAdsCheckStatus = "ready" | "partial" | "no_go" | "running" | "failed" | "unknown";

function unwrapRecord(json: unknown): Record<string, unknown> | null {
  if (!json || typeof json !== "object") return null;
  const o = json as Record<string, unknown>;
  if (o.data && typeof o.data === "object" && !Array.isArray(o.data)) {
    return { ...o, ...(o.data as Record<string, unknown>) };
  }
  return o;
}

function detailFromJson(json: unknown): string {
  if (json == null) return "Request failed";
  if (typeof json === "object" && json !== null && "detail" in json) {
    const d = (json as { detail: unknown }).detail;
    if (typeof d === "string") return d;
    if (Array.isArray(d))
      return d
        .map((x) => (typeof x === "object" && x && "msg" in x ? String((x as { msg: unknown }).msg) : String(x)))
        .join("; ");
    return JSON.stringify(d);
  }
  return "Request failed";
}

function tenantHeaders(tenantId: string | null | undefined): Record<string, string> {
  const h: Record<string, string> = {};
  if (tenantId?.trim()) h["X-Tenant-ID"] = tenantId.trim();
  return h;
}

export type PostGoogleAdsAgentCheckRunOptions = {
  initiatedBy?: string | null;
  tenantId?: string | null;
};

/** POST /checks/run — unwraps `run` from backend envelope `{ persisted, run, persist_error? }`. */
export async function postGoogleAdsAgentCheckRun(
  tenantIdOrOptions?: string | null | PostGoogleAdsAgentCheckRunOptions
): Promise<SuiteResult<Record<string, unknown>>> {
  let opts: PostGoogleAdsAgentCheckRunOptions;
  if (
    tenantIdOrOptions != null &&
    typeof tenantIdOrOptions === "object" &&
    !Array.isArray(tenantIdOrOptions)
  ) {
    opts = tenantIdOrOptions;
  } else {
    opts = { tenantId: (tenantIdOrOptions as string | null | undefined) ?? null };
  }
  const { initiatedBy = null, tenantId = null } = opts;

  try {
    const body = JSON.stringify({
      ...(initiatedBy != null && String(initiatedBy).trim() !== ""
        ? { initiated_by: String(initiatedBy).trim() }
        : {}),
    });
    const res = await fetch(`${BASE}${PREFIX}/run`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...tenantHeaders(tenantId),
      },
      body,
    });
    const json = (await res.json().catch(() => null)) as unknown;
    const unwrapped = unwrapRecord(json) ?? (typeof json === "object" && json ? (json as Record<string, unknown>) : {});
    if (!res.ok) {
      return { ok: false as const, error: detailFromJson(json), status: res.status };
    }
    const envelope = unwrapped as Record<string, unknown>;
    const run =
      envelope.run && typeof envelope.run === "object" && !Array.isArray(envelope.run)
        ? (envelope.run as Record<string, unknown>)
        : envelope;
    const data: Record<string, unknown> = {
      ...run,
      persisted: envelope.persisted,
      persist_error: envelope.persist_error ?? null,
    };
    return { ok: true as const, data, status: res.status };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message, status: 0 };
  }
}

/** 404 → null (no runs yet). */
export async function getGoogleAdsAgentCheckLatest(
  tenantId?: string | null
): Promise<SuiteResult<Record<string, unknown> | null>> {
  try {
    const res = await fetch(`${BASE}${PREFIX}/latest`, {
      cache: "no-store",
      headers: { Accept: "application/json", ...tenantHeaders(tenantId) },
    });
    if (res.status === 404) {
      return { ok: true as const, data: null, status: 404 };
    }
    if (res.status === 503) {
      const json = (await res.json().catch(() => null)) as unknown;
      return {
        ok: false as const,
        error: detailFromJson(json) || "Database unavailable — no persisted check runs",
        status: 503,
      };
    }
    const json = (await res.json().catch(() => null)) as unknown;
    if (!res.ok) {
      return { ok: false as const, error: detailFromJson(json), status: res.status };
    }
    const unwrapped = unwrapRecord(json);
    return { ok: true as const, data: unwrapped, status: res.status };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message, status: 0 };
  }
}

export async function getGoogleAdsAgentCheckHistory(
  limit = 20,
  tenantId?: string | null
): Promise<SuiteResult<Record<string, unknown>>> {
  try {
    const q = new URLSearchParams({ limit: String(limit) });
    const res = await fetch(`${BASE}${PREFIX}/history?${q.toString()}`, {
      cache: "no-store",
      headers: { Accept: "application/json", ...tenantHeaders(tenantId) },
    });
    const json = (await res.json().catch(() => null)) as unknown;
    const normalized: unknown = Array.isArray(json) ? { items: json } : json;
    const unwrapped =
      unwrapRecord(normalized) ??
      (typeof normalized === "object" && normalized ? (normalized as Record<string, unknown>) : {});
    if (!res.ok) {
      return { ok: false as const, error: detailFromJson(json), status: res.status };
    }
    return { ok: true as const, data: unwrapped, status: res.status };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message, status: 0 };
  }
}

export async function getGoogleAdsAgentCheckByRunId(
  runId: string,
  tenantId?: string | null
): Promise<SuiteResult<Record<string, unknown>>> {
  try {
    const res = await fetch(`${BASE}${PREFIX}/${encodeURIComponent(runId)}`, {
      cache: "no-store",
      headers: { Accept: "application/json", ...tenantHeaders(tenantId) },
    });
    const json = (await res.json().catch(() => null)) as unknown;
    const unwrapped = unwrapRecord(json) ?? (typeof json === "object" && json ? (json as Record<string, unknown>) : {});
    if (!res.ok) {
      return { ok: false as const, error: detailFromJson(json), status: res.status };
    }
    return { ok: true as const, data: unwrapped, status: res.status };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message, status: 0 };
  }
}

/** Normalize backend status strings to known enum. */
export function normalizeGoogleAdsCheckStatus(raw: unknown): GoogleAdsCheckStatus {
  const s = String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  if (s === "ready" || s === "full_ready") return "ready";
  if (s === "partial") return "partial";
  if (s === "no_go" || s === "no-go" || s === "nogo" || s === "block" || s === "blocked") return "no_go";
  if (s === "running" || s === "in_progress" || s === "pending") return "running";
  if (s === "failed" || s === "error" || s === "crashed") return "failed";
  if (!s) return "unknown";
  return "unknown";
}

export function humanStatusMeaning(status: GoogleAdsCheckStatus): string {
  switch (status) {
    case "ready":
      return "Full stack passed";
    case "partial":
      return "Offline checks passed, but environment/full quickstart incomplete";
    case "no_go":
      return "Critical checks failed";
    case "running":
      return "Check in progress";
    case "failed":
      return "Runner crashed unexpectedly";
    default:
      return "Status not reported";
  }
}

export type ParsedStep = {
  name: string;
  status: string;
  detail: string;
  durationMs: number | null;
};

function pickStepName(row: Record<string, unknown>): string {
  const n = row.name ?? row.step ?? row.step_name ?? row.id ?? row.key;
  return String(n ?? "step").trim() || "step";
}

export function parseSteps(payload: Record<string, unknown> | null | undefined): ParsedStep[] {
  if (!payload) return [];
  const raw =
    payload.steps ?? payload.step_results ?? payload.results ?? payload.items ?? payload.checks;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is Record<string, unknown> => x != null && typeof x === "object" && !Array.isArray(x))
    .map((row) => {
      const st = String(row.status ?? row.state ?? row.result ?? "").trim() || "—";
      const detail =
        typeof row.detail === "string"
          ? row.detail
          : typeof row.message === "string"
            ? row.message
            : typeof row.output === "string"
              ? row.output
              : "";
      let durationMs: number | null = null;
      const d = row.duration_ms ?? row.durationMs ?? row.duration;
      if (typeof d === "number" && !Number.isNaN(d)) durationMs = d;
      else if (typeof d === "string" && /^\d+(\.\d+)?$/.test(d)) durationMs = Math.round(parseFloat(d));

      return {
        name: pickStepName(row),
        status: st,
        detail: detail.trim(),
        durationMs,
      };
    });
}

export function historyRunsFromPayload(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) {
    return data.filter(
      (x): x is Record<string, unknown> => x != null && typeof x === "object" && !Array.isArray(x)
    );
  }
  if (!data || typeof data !== "object") return [];
  const o = data as Record<string, unknown>;
  const raw = o.runs ?? o.items ?? o.history ?? o.data;
  if (Array.isArray(raw)) {
    return raw.filter((x): x is Record<string, unknown> => x != null && typeof x === "object" && !Array.isArray(x));
  }
  return [];
}

export function countStepsPassedFailed(payload: Record<string, unknown> | null | undefined): {
  passed: number | null;
  failed: number | null;
} {
  if (!payload) return { passed: null, failed: null };
  const po =
    payload.passed_count ??
    payload.passed_steps ??
    payload.passed ??
    payload.steps_passed;
  const fo =
    payload.failed_count ??
    payload.failed_steps ??
    payload.failed ??
    payload.steps_failed;
  const p =
    typeof po === "number" ? po : po != null && String(po).match(/^\d+$/) ? parseInt(String(po), 10) : null;
  const f =
    typeof fo === "number" ? fo : fo != null && String(fo).match(/^\d+$/) ? parseInt(String(fo), 10) : null;
  return { passed: p, failed: f };
}

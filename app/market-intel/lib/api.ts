/**
 * Market Intelligence API client — sole integration seam (F5b).
 * All calls use Bearer + X-Tenant-ID via shared fetch helpers.
 */

import { apiFetch } from "@/lib/api/fetch-client";
import {
  FIXTURE_RUNS,
  fixtureRunById,
  fixtureSnapshotByRunId,
} from "./fixtures";
import {
  MarketIntelApiError,
  type CreateRunBody,
  type RunResponse,
  type SnapshotPayload,
  type UploadResponse,
  type ValidateRunBody,
  type ValidateRunResult,
} from "./types";

const BASE = "/api/v1/market-intel";

function requireTenant(tenantId: string): string {
  const t = tenantId?.trim() ?? "";
  if (!t) {
    throw new MarketIntelApiError("Seleccione una institución", 0);
  }
  return t;
}

async function parseDetail(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

async function handleJson<T>(res: Response): Promise<T> {
  const detail = await parseDetail(res);
  if (!res.ok) {
    let msg = `Error HTTP ${res.status}`;
    if (detail && typeof detail === "object" && detail !== null) {
      const root = detail as Record<string, unknown>;
      const d = root.detail;
      if (typeof d === "string") msg = d;
      else if (typeof root.message === "string") msg = root.message;
    } else if (typeof detail === "string") msg = detail;
    throw new MarketIntelApiError(msg, res.status, detail);
  }
  return detail as T;
}

function tenantHeaders(tenantId: string, extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  headers.set("Accept", "application/json");
  headers.set("X-Tenant-ID", tenantId.trim());
  return headers;
}

function useFixtureRuns(): boolean {
  return process.env.NEXT_PUBLIC_MARKET_INTEL_USE_FIXTURES === "true";
}

async function withFixtureFallback<T>(
  live: () => Promise<T>,
  fallback: () => T
): Promise<T> {
  if (useFixtureRuns()) return fallback();
  try {
    return await live();
  } catch {
    return fallback();
  }
}

export async function listRuns(tenantId: string): Promise<RunResponse[]> {
  const tid = requireTenant(tenantId);
  return withFixtureFallback(
    async () => {
      const res = await apiFetch(`${BASE}/runs`, {
        method: "GET",
        headers: tenantHeaders(tid),
      });
      const data = await handleJson<RunResponse[]>(res);
      return Array.isArray(data) ? data : [];
    },
    () => [...FIXTURE_RUNS]
  );
}

export async function getRun(tenantId: string, runId: string): Promise<RunResponse> {
  const tid = requireTenant(tenantId);
  return withFixtureFallback(
    async () => {
      const res = await apiFetch(`${BASE}/runs/${encodeURIComponent(runId)}`, {
        method: "GET",
        headers: tenantHeaders(tid),
      });
      return handleJson<RunResponse>(res);
    },
    () => {
      const found = fixtureRunById(runId);
      if (!found) throw new MarketIntelApiError("Run no encontrado", 404);
      return found;
    }
  );
}

export async function createRun(tenantId: string, body: CreateRunBody): Promise<RunResponse> {
  const tid = requireTenant(tenantId);
  if (useFixtureRuns()) {
    const now = new Date().toISOString();
    return {
      id: `run-fixture-${Date.now()}`,
      status: "draft",
      country_iso: body.country_iso,
      vertical: body.vertical,
      product: body.product,
      currency: body.country_iso === "DO" ? "DOP" : "USD",
      created_at: now,
      updated_at: now,
    };
  }
  const res = await apiFetch(`${BASE}/runs`, {
    method: "POST",
    headers: tenantHeaders(tid, { "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  return handleJson<RunResponse>(res);
}

export async function startRun(tenantId: string, runId: string): Promise<RunResponse> {
  const tid = requireTenant(tenantId);
  if (useFixtureRuns()) {
    const base = fixtureRunById(runId);
    if (!base) throw new MarketIntelApiError("Run no encontrado", 404);
    return { ...base, status: "needs_validation", updated_at: new Date().toISOString() };
  }
  const res = await apiFetch(`${BASE}/runs/${encodeURIComponent(runId)}/start`, {
    method: "POST",
    headers: tenantHeaders(tid),
  });
  return handleJson<RunResponse>(res);
}

export async function getSnapshot(tenantId: string, runId: string): Promise<SnapshotPayload | null> {
  const tid = requireTenant(tenantId);
  return withFixtureFallback(
    async () => {
      const res = await apiFetch(`${BASE}/runs/${encodeURIComponent(runId)}/snapshot`, {
        method: "GET",
        headers: tenantHeaders(tid),
      });
      if (res.status === 404) return null;
      return handleJson<SnapshotPayload>(res);
    },
    () => fixtureSnapshotByRunId(runId)
  );
}

export async function uploadDocument(
  tenantId: string,
  runId: string,
  file: File
): Promise<UploadResponse> {
  const tid = requireTenant(tenantId);
  if (useFixtureRuns()) {
    return {
      id: `doc-${Date.now()}`,
      source_name: file.name,
      source_level: "operator_upload",
      filename: file.name,
      uploaded_at: new Date().toISOString(),
    };
  }
  const form = new FormData();
  form.append("file", file);
  const res = await apiFetch(`${BASE}/runs/${encodeURIComponent(runId)}/documents`, {
    method: "POST",
    headers: tenantHeaders(tid),
    body: form,
  });
  return handleJson<UploadResponse>(res);
}

export async function validateRun(
  tenantId: string,
  runId: string,
  body: ValidateRunBody
): Promise<ValidateRunResult> {
  const tid = requireTenant(tenantId);
  if (useFixtureRuns()) {
    const base = fixtureRunById(runId);
    if (!base) throw new MarketIntelApiError("Run no encontrado", 404);
    const counselFindings = fixtureSnapshotByRunId(runId)?.findings.some(
      (f) => f.requires_counsel_review
    );
    if (counselFindings && !body.counsel_signed) {
      return { run: base, counselRequired: true };
    }
    if (base.status === "validated") {
      return { run: base, alreadyValidated: true };
    }
    return {
      run: {
        ...base,
        status: "validated",
        validated_by: "fixture@operator.local",
        validated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };
  }

  const res = await apiFetch(`${BASE}/runs/${encodeURIComponent(runId)}/validate`, {
    method: "POST",
    headers: tenantHeaders(tid, { "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });

  if (res.status === 400) {
    const base = await getRun(tid, runId);
    return { run: base, counselRequired: true };
  }
  if (res.status === 409) {
    const base = await getRun(tid, runId);
    return { run: base, alreadyValidated: true };
  }

  const run = await handleJson<RunResponse>(res);
  return { run };
}

// Re-export error class for consumers
export { MarketIntelApiError } from "./types";

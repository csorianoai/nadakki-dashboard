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
  type Finding,
  type MarketOverview,
  type RunResponse,
  type SnapshotPayload,
  type SnapshotRow,
  type SourcesSummary,
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

function asRecord(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  return raw as Record<string, unknown>;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function parseEmbeddedJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return null;
  }
}

/** /runs and /runs/{id} — typed RunResponse with defensive coercion. */
export function normalizeRunResponse(raw: unknown): RunResponse {
  const o = asRecord(raw);
  if (!o) {
    throw new MarketIntelApiError("Respuesta de run inválida", 502);
  }

  const now = new Date().toISOString();
  return {
    id: asString(o.id, "unknown"),
    status: asString(o.status, "draft"),
    country_iso: asString(o.country_iso),
    vertical: asString(o.vertical),
    product: asString(o.product),
    currency: asString(o.currency),
    validated_by: typeof o.validated_by === "string" ? o.validated_by : undefined,
    validated_at: typeof o.validated_at === "string" ? o.validated_at : undefined,
    snapshot_sha256: typeof o.snapshot_sha256 === "string" ? o.snapshot_sha256 : undefined,
    created_at: asString(o.created_at, now),
    updated_at: asString(o.updated_at, now),
  };
}

/**
 * /start and /validate return raw dicts — merge defensively onto a base run.
 * Reads `status` and other present fields without assuming a strict schema.
 */
function coerceRunFromDict(raw: unknown, base: RunResponse): RunResponse {
  const o = asRecord(raw);
  if (!o) return base;

  if (typeof o.id === "string" && typeof o.country_iso === "string") {
    return normalizeRunResponse(raw);
  }

  const merged: RunResponse = { ...base };
  if (typeof o.status === "string" && o.status) merged.status = o.status;
  if (typeof o.validated_by === "string") merged.validated_by = o.validated_by;
  if (typeof o.validated_at === "string") merged.validated_at = o.validated_at;
  if (typeof o.snapshot_sha256 === "string") merged.snapshot_sha256 = o.snapshot_sha256;
  if (typeof o.updated_at === "string") merged.updated_at = o.updated_at;
  return merged;
}

function coerceSnapshotPayload(raw: unknown): SnapshotPayload | null {
  const o = asRecord(raw);
  if (!o) return null;

  const sourcesRaw = asRecord(o.sources_summary);
  const findingsRaw = o.findings;
  const overviewRaw = asRecord(o.market_overview);

  if (!sourcesRaw || !overviewRaw) return null;

  const byLevel = asRecord(sourcesRaw.by_level) ?? {};
  const byConfidence = asRecord(sourcesRaw.by_confidence) ?? {};

  const sources_summary: SourcesSummary = {
    total: typeof sourcesRaw.total === "number" ? sourcesRaw.total : 0,
    by_level: Object.fromEntries(
      Object.entries(byLevel).map(([k, v]) => [k, typeof v === "number" ? v : 0])
    ),
    by_confidence: Object.fromEntries(
      Object.entries(byConfidence).map(([k, v]) => [k, typeof v === "number" ? v : 0])
    ),
  };

  const findings: Finding[] = Array.isArray(findingsRaw)
    ? findingsRaw
        .map((item) => {
          const f = asRecord(item);
          if (!f) return null;
          return {
            source_name: asString(f.source_name),
            source_level: asString(f.source_level),
            confidence: asString(f.confidence),
            category: asString(f.category),
            tier: asString(f.tier),
            validation_status: asString(f.validation_status),
            requires_counsel_review: Boolean(f.requires_counsel_review),
            summary: asString(f.summary),
            data_points: Array.isArray(f.data_points)
              ? f.data_points.filter(
                  (dp): dp is Record<string, unknown> =>
                    Boolean(dp) && typeof dp === "object" && !Array.isArray(dp)
                )
              : [],
          } satisfies Finding;
        })
        .filter((f): f is Finding => f !== null)
    : [];

  const market_overview = overviewRaw as unknown as MarketOverview;
  const metadataRaw = asRecord(o.metadata);

  return {
    sources_summary,
    findings,
    market_overview,
    entry_strategy: asRecord(o.entry_strategy) ?? undefined,
    pricing_proposal: asRecord(o.pricing_proposal) ?? undefined,
    validation_state: asString(o.validation_state, "unknown"),
    metadata: metadataRaw ?? {},
  };
}

/** Parse GET /snapshot row envelope → intelligence in `.payload`. */
export function parseSnapshotRow(raw: unknown): SnapshotPayload | null {
  const o = asRecord(raw);
  if (!o) return null;

  if ("payload" in o) {
    const row: SnapshotRow = {
      id: asString(o.id),
      run_id: asString(o.run_id),
      phase: asString(o.phase),
      version: asString(o.version),
      payload: o.payload,
      created_at: asString(o.created_at),
    };
    void row;
    const payloadRaw = parseEmbeddedJson(o.payload);
    return coerceSnapshotPayload(payloadRaw);
  }

  return coerceSnapshotPayload(raw);
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

async function handleJson(res: Response): Promise<unknown> {
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
  return detail;
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
      const data = await handleJson(res);
      if (!Array.isArray(data)) return [];
      return data.map((item) => normalizeRunResponse(item));
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
      return normalizeRunResponse(await handleJson(res));
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
  return normalizeRunResponse(await handleJson(res));
}

export async function startRun(tenantId: string, runId: string): Promise<RunResponse> {
  const tid = requireTenant(tenantId);
  if (useFixtureRuns()) {
    const base = fixtureRunById(runId);
    if (!base) throw new MarketIntelApiError("Run no encontrado", 404);
    return { ...base, status: "needs_validation", updated_at: new Date().toISOString() };
  }

  const base = await getRun(tid, runId);
  const res = await apiFetch(`${BASE}/runs/${encodeURIComponent(runId)}/start`, {
    method: "POST",
    headers: tenantHeaders(tid),
  });
  const raw = await handleJson(res);
  return coerceRunFromDict(raw, base);
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
      const raw = await handleJson(res);
      return parseSnapshotRow(raw);
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
  const raw = await handleJson(res);
  const o = asRecord(raw);
  if (!o) throw new MarketIntelApiError("Respuesta de upload inválida", 502);
  return {
    id: asString(o.id, `doc-${Date.now()}`),
    source_name: asString(o.source_name, file.name),
    source_level: asString(o.source_level, "operator_upload"),
    filename: asString(o.filename, file.name),
    uploaded_at: asString(o.uploaded_at, new Date().toISOString()),
  };
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

  const base = await getRun(tid, runId);

  const res = await apiFetch(`${BASE}/runs/${encodeURIComponent(runId)}/validate`, {
    method: "POST",
    headers: tenantHeaders(tid, { "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });

  if (res.status === 400) {
    return { run: base, counselRequired: true };
  }
  if (res.status === 409) {
    return { run: base, alreadyValidated: true };
  }

  const raw = await handleJson(res);
  return { run: coerceRunFromDict(raw, base) };
}

export { MarketIntelApiError } from "./types";

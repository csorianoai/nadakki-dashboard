/**
 * Credit Core — client-side API helpers for /api/v2/credit/* (FastAPI).
 * Pattern: direct fetch to NEXT_PUBLIC_API_URL with JSON + X-Tenant-ID (same as app/api/health, SIC routes).
 */

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
).replace(/\/$/, "");

/** Safe segment for sessionStorage keys; avoids empty or pathological tenant strings. */
function tenantStorageSegment(tenantId?: string | null): string {
  const t = (tenantId ?? "").trim();
  if (!t) return "_";
  const safe = t.replace(/[^a-zA-Z0-9._-]/g, "_");
  return safe.length > 0 ? safe.slice(0, 128) : "_";
}

/**
 * Session key for cached POST /process payload.
 * Pattern: nadakki_credit_${tenantId}_${applicationId}
 * Callers may pass tenantId on save/load to isolate tenants; omitted → "_".
 */
export function processResultStorageKey(
  applicationId: string,
  tenantId?: string | null
): string {
  return `nadakki_credit_${tenantStorageSegment(tenantId)}_${applicationId}`;
}

const LEGACY_PROCESS_STORAGE_PREFIX = "nadakki_credit_process_";

export function saveProcessResultToSession(
  applicationId: string,
  result: CreditProcessResult,
  tenantId?: string | null
): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      processResultStorageKey(applicationId, tenantId),
      JSON.stringify(result)
    );
  } catch {
    /* quota / private mode */
  }
}

export function loadProcessResultFromSession(
  applicationId: string,
  tenantId?: string | null
): CreditProcessResult | null {
  if (typeof window === "undefined") return null;
  try {
    const key = processResultStorageKey(applicationId, tenantId);
    let raw = window.sessionStorage.getItem(key);
    if (!raw) {
      raw = window.sessionStorage.getItem(
        `${LEGACY_PROCESS_STORAGE_PREFIX}${applicationId}`
      );
    }
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && "success" in parsed) {
      return parsed as CreditProcessResult;
    }
  } catch {
    return null;
  }
  return null;
}

export type ApplicationMode = "AI_ONLY" | "BANK_ONLY" | "HYBRID";

/** Minimal CSV so Credit Core SIC pipeline can run during demo (matches validation fixtures). */
const DEMO_STATEMENT_CSV =
  "posted_date,amount,currency,direction,description_raw\n" +
  "2024-01-01,1000,USD,credit,Salary\n" +
  "2024-02-01,1000,USD,credit,Salary\n" +
  "2024-03-01,1000,USD,credit,Salary\n";

export interface CreditApplicationResponse {
  trace_id: string;
  tenant_id: string;
  application_id: string;
  state: string;
  application_payload: {
    mode?: ApplicationMode | string;
    applicant_data?: Record<string, unknown>;
    dry_run?: boolean;
    statement_csv?: string;
  } & Record<string, unknown>;
}

/** Backend event row from GET .../events */
export interface CreditEventRow {
  event_id?: string;
  tenant_id?: string;
  trace_id?: string;
  application_id?: string;
  event_type: string;
  payload?: Record<string, unknown>;
  emitted_at: string;
}

export interface AiDecisionShape {
  trace_id?: string;
  application_id?: string;
  decision_channel?: string;
  source_system?: string;
  decision?: string;
  recommendation?: string;
  reason_codes?: Array<{ code: string } | string>;
  dry_run?: boolean;
  score?: number;
  confidence?: number;
  /** SIC / underwriting context — all optional for backward compatibility. */
  income_verified?: boolean | null;
  monthly_income_estimate?: number | null;
  recurring_income_monthly_median?: number | null;
  income_stability_score?: number | null;
  income_group_count?: number | null;
  total_outliers?: number | null;
  total_transfer_pairs?: number | null;
  sic_used?: boolean | null;
  sic_fallback?: boolean | null;
  confidence_overall?: number | null;
  review_required?: boolean | null;
}

export interface BankDecisionShape {
  trace_id?: string;
  application_id?: string;
  decision_channel?: string;
  source_system?: string;
  decision?: string;
  reason_codes?: string[];
  dry_run?: boolean;
}

export interface BankLegWrapper {
  success?: boolean;
  trace_id?: string;
  application_id?: string;
  stub?: boolean;
  bank_decision?: BankDecisionShape;
  adapter_operation_mode?: string;
  message?: string;
}

export interface CreditProcessResult {
  success: boolean;
  status?: string;
  state?: string;
  trace_id?: string;
  tenant_id?: string;
  application_id?: string;
  mode?: string;
  dry_run?: boolean;
  ai?: AiDecisionShape | null;
  ai_decision?: AiDecisionShape | null;
  bank?: BankLegWrapper | null;
  hybrid?: {
    success?: boolean;
    trace_id?: string;
    application_id?: string;
    ai?: AiDecisionShape;
    bank?: BankLegWrapper;
    note?: string;
  } | null;
}

function creditHeaders(
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

/** GET /api/v2/credit/health — never throws; use for UI badge when backend omits route. */
export async function getCreditHealth(tenantId: string): Promise<{
  ok: boolean;
  status: number;
  body?: unknown;
}> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v2/credit/health`, {
      method: "GET",
      headers: creditHeaders(tenantId, { jsonBody: false }),
    });
    if (!res.ok) {
      return { ok: false, status: res.status };
    }
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = undefined;
    }
    return { ok: true, status: res.status, body };
  } catch {
    return { ok: false, status: 0 };
  }
}

export async function createApplication(
  tenantId: string,
  mode: ApplicationMode,
  applicantData: Record<string, unknown>,
  dryRun = true
): Promise<{ application_id: string; state?: string }> {
  const res = await fetch(`${BACKEND_URL}/api/v2/credit/applications`, {
    method: "POST",
    headers: creditHeaders(tenantId),
    body: JSON.stringify({
      application_payload: {
        mode,
        applicant_data: applicantData,
        dry_run: dryRun,
        statement_csv: DEMO_STATEMENT_CSV,
      },
      initial_state: "DRAFT",
    }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(`Create failed: ${res.status} ${errText}`);
  }
  return res.json() as Promise<{ application_id: string; state?: string }>;
}

export async function processApplication(
  tenantId: string,
  applicationId: string,
  mode: ApplicationMode,
  dryRun = true
): Promise<CreditProcessResult> {
  const res = await fetch(
    `${BACKEND_URL}/api/v2/credit/applications/${encodeURIComponent(applicationId)}/process`,
    {
      method: "POST",
      headers: creditHeaders(tenantId),
      body: JSON.stringify({ mode, dry_run: dryRun }),
    }
  );
  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(`Process failed: ${res.status} ${errText}`);
  }
  return res.json() as Promise<CreditProcessResult>;
}

export async function getApplication(
  tenantId: string,
  applicationId: string
): Promise<CreditApplicationResponse | null> {
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/v2/credit/applications/${encodeURIComponent(applicationId)}`,
      { headers: creditHeaders(tenantId, { jsonBody: false }) }
    );
    if (!res.ok) {
      return null;
    }
    return (await res.json()) as CreditApplicationResponse;
  } catch {
    return null;
  }
}

export async function getApplicationEvents(
  tenantId: string,
  applicationId: string
): Promise<{ events: CreditEventRow[]; count: number }> {
  const res = await fetch(
    `${BACKEND_URL}/api/v2/credit/applications/${encodeURIComponent(applicationId)}/events`,
    { headers: creditHeaders(tenantId, { jsonBody: false }) }
  );
  if (!res.ok) {
    return { events: [], count: 0 };
  }
  const data = (await res.json()) as { events?: CreditEventRow[] };
  const events = Array.isArray(data.events) ? data.events : [];
  return { events, count: events.length };
}

/** GET /api/v2/credit/applications — returns null if missing or non-OK (no throw). */
export async function listCreditApplications(
  tenantId: string
): Promise<{ applications?: unknown[]; items?: unknown[] } | null> {
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/v2/credit/applications`,
      { headers: creditHeaders(tenantId, { jsonBody: false }) }
    );
    if (!res.ok) return null;
    return (await res.json()) as { applications?: unknown[]; items?: unknown[] };
  } catch {
    return null;
  }
}

/** GET /api/v2/credit/stats — returns null if missing or non-OK (no throw). */
export async function getCreditStats(
  tenantId: string
): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v2/credit/stats`, {
      headers: creditHeaders(tenantId, { jsonBody: false }),
    });
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

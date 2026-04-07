/**
 * Credit Core — client-side API helpers for /api/v2/credit/* (FastAPI).
 * Pattern: direct fetch to NEXT_PUBLIC_API_URL with JSON + X-Tenant-ID (same as app/api/health, SIC routes).
 */

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
).replace(/\/$/, "");

/** Credicefi pilot tenant — replace via TenantContext when auth wiring is complete. */
export const CREDICEFI_PILOT_TENANT_ID =
  "366b3c6c-a899-4320-805e-5c1d7c896f74";

export function processResultStorageKey(applicationId: string): string {
  return `nadakki_credit_process_${applicationId}`;
}

export function saveProcessResultToSession(
  applicationId: string,
  result: CreditProcessResult
): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      processResultStorageKey(applicationId),
      JSON.stringify(result)
    );
  } catch {
    /* quota / private mode */
  }
}

export function loadProcessResultFromSession(
  applicationId: string
): CreditProcessResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(
      processResultStorageKey(applicationId)
    );
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
  income_verified?: boolean;
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

function creditHeaders(tenantId: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Tenant-ID": tenantId,
  };
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
): Promise<CreditApplicationResponse> {
  const res = await fetch(
    `${BACKEND_URL}/api/v2/credit/applications/${encodeURIComponent(applicationId)}`,
    { headers: creditHeaders(tenantId) }
  );
  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(`Get failed: ${res.status} ${errText}`);
  }
  return res.json() as Promise<CreditApplicationResponse>;
}

export async function getApplicationEvents(
  tenantId: string,
  applicationId: string
): Promise<{ events: CreditEventRow[]; count: number }> {
  const res = await fetch(
    `${BACKEND_URL}/api/v2/credit/applications/${encodeURIComponent(applicationId)}/events`,
    { headers: creditHeaders(tenantId) }
  );
  if (!res.ok) {
    return { events: [], count: 0 };
  }
  const data = (await res.json()) as { events?: CreditEventRow[] };
  const events = Array.isArray(data.events) ? data.events : [];
  return { events, count: events.length };
}

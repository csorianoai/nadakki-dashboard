/**
 * Credit Dealer — typed client for /api/v2/credit/* (FastAPI).
 * Every call requires tenantId (pass from useTenant()). No hardcoded tenants.
 */

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
).replace(/\/$/, "");

export class CreditApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public detail?: unknown
  ) {
    super(message);
    this.name = "CreditApiError";
  }
}

export type ApplicationMode = "AI_ONLY" | "BANK_ONLY" | "HYBRID";

export interface CreateApplicationBody {
  application_payload: Record<string, unknown>;
  initial_state?: "DRAFT";
}

export interface ApplicantPayload {
  name: string;
  monthly_income: number;
  co_borrower_name?: string | null;
  co_borrower_monthly_income?: number | null;
  employment_status?: string | null;
  national_id?: string | null;
}

export interface VehiclePayload {
  vin?: string | null;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  vehicle_value?: number | null;
  loan_amount_requested?: number | null;
}

export interface OfferCreatePayload {
  lender_name: string;
  apr_annual: number;
  term_months: number;
  monthly_payment?: number | null;
  status: "APROBADO" | "APROBADO_CONDICIONADO" | "RECHAZADO" | "PENDIENTE";
  terms?: Record<string, unknown>;
}

export interface ProcessPayload {
  mode: ApplicationMode;
  dry_run?: boolean;
}

export interface CreditApplicationRow {
  application_id?: string;
  state?: string;
  mode?: string | null;
  dry_run?: boolean;
  has_result?: boolean;
  events_count?: number;
  created_at?: string;
}

export interface ListApplicationsResponse {
  applications?: CreditApplicationRow[];
  total?: number;
  tenant_id?: string;
  trace_id?: string;
}

export interface CreditApplicationResponse {
  trace_id?: string;
  tenant_id?: string;
  application_id: string;
  state?: string;
  application_payload?: Record<string, unknown>;
}

export interface CreditEventRow {
  event_id?: string;
  event_type: string;
  payload?: Record<string, unknown>;
  emitted_at: string;
}

export interface FullDossier {
  tenant_id?: string;
  application_id?: string;
  state?: string;
  trace_id?: string;
  application?: Record<string, unknown>;
  applicant?: Record<string, unknown> | null;
  vehicle?: Record<string, unknown> | null;
  ai_decision?: Record<string, unknown> | null;
  offers?: Record<string, unknown>[];
  events?: CreditEventRow[];
}

export interface ExplanationResponse {
  normalized?: Record<string, unknown>;
  factors?: Array<{ reason_code: string; human_factor: string }>;
  trace_id?: string;
}

export interface OptimizationResponse {
  tenant_id?: string;
  income_basis?: string;
  reference_annual_rate?: number;
  metrics?: Record<string, unknown>;
  top_actions?: Array<Record<string, unknown>>;
  trace_id?: string;
}

export interface OffersRankResponse {
  best_overall?: Record<string, unknown> | null;
  ranked_eligible?: Record<string, unknown>[];
  scores?: Array<{ offer_id?: string; score?: number }>;
  all_offers_count?: number;
  trace_id?: string;
}

function requireTenant(tenantId: string): string {
  const t = tenantId?.trim() ?? "";
  if (!t) {
    throw new CreditApiError("Seleccione una institución", 0);
  }
  return t;
}

function baseHeaders(tenantId: string, withJsonBody: boolean): HeadersInit {
  const h: Record<string, string> = {
    Accept: "application/json",
    "X-Tenant-ID": tenantId.trim(),
  };
  if (withJsonBody) {
    h["Content-Type"] = "application/json";
  }
  return h;
}

function humanMessage(status: number, detail: unknown): string {
  if (status === 404) return "Recurso no encontrado";
  if (status === 409) return "Conflicto de estado o duplicado";
  if (status === 422) return "Datos inválidos o incompletos";
  if (status === 400) return "Solicitud no válida";
  if (status === 403) return "No autorizado para este arrendatario";
  if (status === 0) return "Sin conexión o institución no seleccionada";
  if (detail && typeof detail === "object" && detail !== null) {
    const root = detail as Record<string, unknown>;
    const d = root.detail;
    if (typeof d === "string") return d;
    if (d && typeof d === "object") {
      const inner = d as Record<string, unknown>;
      if (typeof inner.error === "string") return inner.error;
      if (typeof inner.message === "string") return inner.message;
    }
    if (typeof root.message === "string") return root.message;
  }
  return `Error HTTP ${status}`;
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
    const msg = humanMessage(res.status, detail);
    throw new CreditApiError(msg, res.status, detail);
  }
  return detail as T;
}

/** POST /api/v2/credit/applications */
export async function createApplication(
  tenantId: string,
  body: CreateApplicationBody
): Promise<CreditApplicationResponse> {
  const tid = requireTenant(tenantId);
  const res = await fetch(`${BACKEND_URL}/api/v2/credit/applications`, {
    method: "POST",
    headers: baseHeaders(tid, true),
    body: JSON.stringify({
      application_payload: body.application_payload,
      initial_state: body.initial_state ?? "DRAFT",
    }),
  });
  return handleJson<CreditApplicationResponse>(res);
}

/** POST .../applicant */
export async function saveApplicant(
  tenantId: string,
  applicationId: string,
  payload: ApplicantPayload
): Promise<Record<string, unknown>> {
  const tid = requireTenant(tenantId);
  const res = await fetch(
    `${BACKEND_URL}/api/v2/credit/applications/${encodeURIComponent(applicationId)}/applicant`,
    {
      method: "POST",
      headers: baseHeaders(tid, true),
      body: JSON.stringify(payload),
    }
  );
  return handleJson(res);
}

/** POST .../vehicle */
export async function saveVehicle(
  tenantId: string,
  applicationId: string,
  payload: VehiclePayload
): Promise<Record<string, unknown>> {
  const tid = requireTenant(tenantId);
  const res = await fetch(
    `${BACKEND_URL}/api/v2/credit/applications/${encodeURIComponent(applicationId)}/vehicle`,
    {
      method: "POST",
      headers: baseHeaders(tid, true),
      body: JSON.stringify(payload),
    }
  );
  return handleJson(res);
}

/** POST .../process */
export async function processApplication(
  tenantId: string,
  applicationId: string,
  payload?: ProcessPayload
): Promise<Record<string, unknown>> {
  const tid = requireTenant(tenantId);
  const body: ProcessPayload = payload ?? {
    mode: "AI_ONLY",
    dry_run: true,
  };
  const res = await fetch(
    `${BACKEND_URL}/api/v2/credit/applications/${encodeURIComponent(applicationId)}/process`,
    {
      method: "POST",
      headers: baseHeaders(tid, true),
      body: JSON.stringify(body),
    }
  );
  return handleJson(res);
}

/** GET .../ single application */
export async function getApplication(
  tenantId: string,
  applicationId: string
): Promise<CreditApplicationResponse> {
  const tid = requireTenant(tenantId);
  const res = await fetch(
    `${BACKEND_URL}/api/v2/credit/applications/${encodeURIComponent(applicationId)}`,
    { headers: baseHeaders(tid, false) }
  );
  return handleJson<CreditApplicationResponse>(res);
}

/** GET .../full */
export async function getApplicationFull(
  tenantId: string,
  applicationId: string
): Promise<FullDossier> {
  const tid = requireTenant(tenantId);
  const res = await fetch(
    `${BACKEND_URL}/api/v2/credit/applications/${encodeURIComponent(applicationId)}/full`,
    { headers: baseHeaders(tid, false) }
  );
  return handleJson<FullDossier>(res);
}

/** GET /api/v2/credit/applications */
export async function listApplications(
  tenantId: string,
  params?: { limit?: number; offset?: number }
): Promise<ListApplicationsResponse> {
  const tid = requireTenant(tenantId);
  const q = new URLSearchParams();
  if (params?.limit != null) q.set("limit", String(params.limit));
  if (params?.offset != null) q.set("offset", String(params.offset));
  const qs = q.toString();
  const res = await fetch(
    `${BACKEND_URL}/api/v2/credit/applications${qs ? `?${qs}` : ""}`,
    { headers: baseHeaders(tid, false) }
  );
  return handleJson<ListApplicationsResponse>(res);
}

/** POST .../offers */
export async function createOffer(
  tenantId: string,
  applicationId: string,
  payload: OfferCreatePayload
): Promise<Record<string, unknown>> {
  const tid = requireTenant(tenantId);
  const res = await fetch(
    `${BACKEND_URL}/api/v2/credit/applications/${encodeURIComponent(applicationId)}/offers`,
    {
      method: "POST",
      headers: baseHeaders(tid, true),
      body: JSON.stringify(payload),
    }
  );
  return handleJson(res);
}

/** GET .../offers */
export async function listOffers(
  tenantId: string,
  applicationId: string
): Promise<{ offers: Record<string, unknown>[]; trace_id?: string }> {
  const tid = requireTenant(tenantId);
  const res = await fetch(
    `${BACKEND_URL}/api/v2/credit/applications/${encodeURIComponent(applicationId)}/offers`,
    { headers: baseHeaders(tid, false) }
  );
  return handleJson(res);
}

/** GET .../explanation */
export async function getExplanation(
  tenantId: string,
  applicationId: string
): Promise<ExplanationResponse> {
  const tid = requireTenant(tenantId);
  const res = await fetch(
    `${BACKEND_URL}/api/v2/credit/applications/${encodeURIComponent(applicationId)}/explanation`,
    { headers: baseHeaders(tid, false) }
  );
  return handleJson<ExplanationResponse>(res);
}

/** GET .../optimize */
export async function getOptimization(
  tenantId: string,
  applicationId: string
): Promise<OptimizationResponse> {
  const tid = requireTenant(tenantId);
  const res = await fetch(
    `${BACKEND_URL}/api/v2/credit/applications/${encodeURIComponent(applicationId)}/optimize`,
    { headers: baseHeaders(tid, false) }
  );
  return handleJson<OptimizationResponse>(res);
}

/** GET .../offers/rank */
export async function getOffersRank(
  tenantId: string,
  applicationId: string
): Promise<OffersRankResponse> {
  const tid = requireTenant(tenantId);
  const res = await fetch(
    `${BACKEND_URL}/api/v2/credit/applications/${encodeURIComponent(applicationId)}/offers/rank`,
    { headers: baseHeaders(tid, false) }
  );
  return handleJson<OffersRankResponse>(res);
}

/** GET .../similar-cases */
export async function getSimilarCases(
  tenantId: string,
  applicationId: string,
  limit = 5
): Promise<{ similar_cases: Record<string, unknown>[]; trace_id?: string }> {
  const tid = requireTenant(tenantId);
  const res = await fetch(
    `${BACKEND_URL}/api/v2/credit/applications/${encodeURIComponent(applicationId)}/similar-cases?limit=${limit}`,
    { headers: baseHeaders(tid, false) }
  );
  return handleJson(res);
}

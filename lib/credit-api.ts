/**
 * Credit Dealer — typed client for /api/v2/credit/* (FastAPI).
 * Every call requires tenantId (pass from useTenant()). No hardcoded tenants.
 *
 * Canonical env var: NEXT_PUBLIC_NADAKKI_API_URL
 * Fallback chain: NEXT_PUBLIC_NADAKKI_API_URL → NEXT_PUBLIC_API_URL
 *   → NEXT_PUBLIC_API_BASE_URL → https://nadakki-ai-suite.onrender.com
 */

import { tokenStorage } from "@/lib/auth/token-storage";

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_NADAKKI_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://nadakki-ai-suite.onrender.com"
).replace(/\/$/, "");

const LEGACY_ACCESS_TOKEN_KEY = "nadakki_sic_token";

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

export interface ApplicantReferenciaPayload {
  nombre?: string;
  telefono?: string;
  relacion?: string;
  /** personal | comercial (or backend-specific) */
  tipo?: string;
}

/** Legacy + codeudor fields; full RD body is built by {@link serializeApplicantForApi}. */
export interface ApplicantSavePayload {
  name?: string;
  monthly_income?: number;
  co_borrower_name?: string | null;
  co_borrower_monthly_income?: number | null;
  employment_status?: string | null;
  national_id?: string | null;
}

export interface ApplicantUiExtra {
  cedula?: string;
  nombre_completo?: string;
  fecha_nacimiento?: string;
  estado_civil?: string;
  nacionalidad?: string;
  telefono_celular?: string;
  email?: string;
  direccion?: string;
  sector?: string;
  municipio?: string;
  provincia?: string;
  tipo_empleo?: string;
  nombre_empleador?: string;
  cargo?: string;
  antiguedad_empleo_meses?: number;
  ingreso_mensual_declarado?: number;
  otros_ingresos?: number;
  monto_solicitado?: number;
  plazo_meses?: number;
  inicial_disponible?: number;
  referencias?: ApplicantReferenciaPayload[];
  co_borrower_cedula?: string;
  co_borrower_email?: string;
  co_borrower_direccion?: string;
  co_borrower_telefono?: string;
  co_borrower_referencias?: ApplicantReferenciaPayload[];
  autoriza_buro?: boolean;
  acepta_politica_datos?: boolean;
  firma_digital?: string;
}

export type ApplicantPayload = ApplicantSavePayload & ApplicantUiExtra;

/** ApplicantDataRDV2 (+ compat); backend uses model extra="ignore" for unknown keys. */
export function serializeApplicantForApi(
  data: ApplicantPayload
): Record<string, unknown> {
  const referenciasFiltered =
    data.referencias?.filter((r) => Boolean(r.nombre?.trim())) ?? [];
  return {
    name: data.nombre_completo || data.name || "",
    monthly_income: data.ingreso_mensual_declarado ?? data.monthly_income ?? 0,
    national_id:
      (data.cedula || data.national_id || "").replace(/\D/g, "") || undefined,
    employment_status: data.tipo_empleo || data.employment_status || undefined,
    nombre_completo: data.nombre_completo || undefined,
    cedula: (data.cedula || "").replace(/\D/g, "") || undefined,
    fecha_nacimiento: data.fecha_nacimiento || undefined,
    estado_civil: data.estado_civil || undefined,
    nacionalidad: data.nacionalidad || "Dominicana",
    telefono_celular: data.telefono_celular || undefined,
    email: data.email || undefined,
    direccion: data.direccion || undefined,
    sector: data.sector || undefined,
    municipio: data.municipio || undefined,
    provincia: data.provincia || undefined,
    tipo_empleo: data.tipo_empleo || undefined,
    nombre_empleador: data.nombre_empleador || undefined,
    cargo: data.cargo || undefined,
    antiguedad_empleo_meses: data.antiguedad_empleo_meses ?? undefined,
    ingreso_mensual_declarado: data.ingreso_mensual_declarado ?? undefined,
    otros_ingresos: data.otros_ingresos ?? 0,
    monto_solicitado: data.monto_solicitado ?? undefined,
    plazo_meses: data.plazo_meses ?? 48,
    inicial_disponible: data.inicial_disponible ?? undefined,
    referencias:
      referenciasFiltered.length > 0 ? referenciasFiltered : undefined,
    autoriza_buro: data.autoriza_buro ?? undefined,
    acepta_politica_datos: data.acepta_politica_datos ?? undefined,
    firma_digital: data.firma_digital || new Date().toISOString(),
    co_borrower_name: data.co_borrower_name ?? undefined,
    co_borrower_monthly_income: data.co_borrower_monthly_income ?? undefined,
    co_borrower_cedula: data.co_borrower_cedula ?? undefined,
    co_borrower_email: data.co_borrower_email ?? undefined,
    co_borrower_direccion: data.co_borrower_direccion ?? undefined,
    co_borrower_telefono: data.co_borrower_telefono ?? undefined,
    co_borrower_referencias:
      data.co_borrower_referencias &&
      data.co_borrower_referencias.length > 0
        ? data.co_borrower_referencias
        : undefined,
  };
}

export interface VehicleSavePayload {
  vin?: string | null;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  vehicle_value?: number | null;
  loan_amount_requested?: number | null;
}

export interface VehicleUiExtra {
  marca?: string;
  modelo?: string;
  version?: string;
  anio?: number;
  condicion?: string;
  transmision?: string;
  combustible?: string;
  color?: string;
  km_odometro?: number;
  vin_chasis?: string;
  placa?: string;
  precio_venta?: number;
  valor_tasacion?: number;
  propietario_vehiculo?: string;
  tiene_gravamen_previo?: boolean;
  entidad_gravamen?: string;
}

export type VehiclePayload = VehicleSavePayload & VehicleUiExtra;

export function serializeVehicleForApi(
  data: VehiclePayload
): Record<string, unknown> {
  return {
    make: data.marca || data.make || undefined,
    model: data.modelo || data.model || undefined,
    year: data.anio ?? data.year ?? undefined,
    vin: data.vin_chasis || data.vin || undefined,
    vehicle_value: data.precio_venta ?? data.vehicle_value ?? undefined,
    loan_amount_requested: data.loan_amount_requested ?? undefined,
    marca: data.marca || undefined,
    modelo: data.modelo || undefined,
    version: data.version || undefined,
    anio: data.anio ?? undefined,
    condicion: data.condicion || undefined,
    transmision: data.transmision || undefined,
    combustible: data.combustible || undefined,
    color: data.color || undefined,
    km_odometro: data.km_odometro ?? 0,
    vin_chasis: data.vin_chasis || undefined,
    placa: data.placa || undefined,
    precio_venta: data.precio_venta ?? undefined,
    valor_tasacion: data.valor_tasacion ?? undefined,
    propietario_vehiculo: data.propietario_vehiculo || undefined,
    tiene_gravamen_previo: data.tiene_gravamen_previo ?? false,
    entidad_gravamen: data.entidad_gravamen || undefined,
  };
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

export interface NarrativeResult {
  dealer_narrative: string;
  bank_narrative: string;
  client_narrative: string;
  generated_at: string;
  application_id: string;
  confidence_label: "ALTA" | "MEDIA" | "BAJA";
  confidence_score: number;
}

export interface WizardStatus {
  application_id: string;
  steps_completed: string[];
  steps_pending: string[];
  completion_pct: number;
  can_submit: boolean;
  blocking_reasons: string[];
}

export interface ConsistencyResult {
  consistency_score: number;
  risk_level: "BAJO" | "MEDIO" | "ALTO";
  flags: string[];
  breakdown: Record<string, string>;
}

export interface CreditDocument {
  id: string;
  application_id: string;
  document_type: string;
  document_category: string;
  file_url: string;
  file_name?: string;
  upload_status: string;
  verification_status: string;
  uploaded_at: string;
}

export interface DocumentCompleteness {
  application_id: string;
  is_complete: boolean;
  missing_categories: string[];
  counts_by_category: Record<string, number>;
  total_documents: number;
  completeness_pct: number;
  detail: string;
}

export interface DemoLoadResult {
  application_id: string;
  case_type: string;
  score?: number;
  recommendation?: string;
  message: string;
}

function requireTenant(tenantId: string): string {
  const t = tenantId?.trim() ?? "";
  if (!t) {
    throw new CreditApiError("Seleccione una institución", 0);
  }
  return t;
}

function readBearerToken(): string | null {
  const v2 = tokenStorage.getAccessToken();
  if (v2) return v2;
  if (typeof window !== "undefined") {
    return window.localStorage.getItem(LEGACY_ACCESS_TOKEN_KEY);
  }
  return null;
}

function baseHeaders(tenantId: string, withJsonBody: boolean): HeadersInit {
  const h: Record<string, string> = {
    Accept: "application/json",
    "X-Tenant-ID": tenantId.trim(),
  };
  const token = readBearerToken();
  if (token) {
    h["Authorization"] = `Bearer ${token}`;
  }
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
      body: JSON.stringify(serializeApplicantForApi(payload)),
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
      body: JSON.stringify(serializeVehicleForApi(payload)),
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

/**
 * GET /credit/applications/{id}/offers
 * NOTE: The offers listing endpoint lives under /credit/ (no /api/v2 prefix).
 * This matches the backend router mount and the useOffers hook.
 */
export async function listOffers(
  tenantId: string,
  applicationId: string
): Promise<{ offers: Record<string, unknown>[]; trace_id?: string }> {
  const tid = requireTenant(tenantId);
  const res = await fetch(
    `${BACKEND_URL}/credit/applications/${encodeURIComponent(applicationId)}/offers`,
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

/**
 * Browser-only PDF download: fetch + blob + object URL so `X-Tenant-ID` is sent.
 * Do not use `window.open()` — tenant header would not be included.
 */
export async function downloadPdf(
  tenantId: string,
  url: string,
  filename: string
): Promise<void> {
  const tid = requireTenant(tenantId);
  if (typeof document === "undefined") {
    throw new Error("PDF download must run in the browser");
  }
  const res = await fetch(url, {
    headers: {
      Accept: "application/pdf",
      "X-Tenant-ID": tid,
    },
  });
  if (!res.ok) {
    throw new Error(`PDF error: ${res.status}`);
  }
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(objectUrl);
}

/** GET .../pdf/application-summary */
export async function downloadApplicationSummaryPdf(
  tenantId: string,
  applicationId: string,
  filename = `credit-application-summary-${applicationId}.pdf`
): Promise<void> {
  const url = `${BACKEND_URL}/api/v2/credit/applications/${encodeURIComponent(applicationId)}/pdf/application-summary`;
  return downloadPdf(tenantId, url, filename);
}

/** GET .../pdf/executive-memo */
export async function downloadExecutiveMemoPdf(
  tenantId: string,
  applicationId: string,
  filename = `credit-executive-memo-${applicationId}.pdf`
): Promise<void> {
  const url = `${BACKEND_URL}/api/v2/credit/applications/${encodeURIComponent(applicationId)}/pdf/executive-memo`;
  return downloadPdf(tenantId, url, filename);
}

/** GET .../offers/{offer_id}/pdf */
export async function downloadOfferPdf(
  tenantId: string,
  applicationId: string,
  offerId: string,
  filename = `credit-offer-${offerId}.pdf`
): Promise<void> {
  const url = `${BACKEND_URL}/api/v2/credit/applications/${encodeURIComponent(applicationId)}/offers/${encodeURIComponent(offerId)}/pdf`;
  return downloadPdf(tenantId, url, filename);
}

function normalizeCreditDocuments(raw: unknown): CreditDocument[] {
  const list = Array.isArray(raw)
    ? raw
    : raw &&
        typeof raw === "object" &&
        Array.isArray((raw as Record<string, unknown>).documents)
      ? ((raw as Record<string, unknown>).documents as unknown[])
      : [];
  return list
    .map((row): CreditDocument | null => {
      if (!row || typeof row !== "object") return null;
      const r = row as Record<string, unknown>;
      const id = r.id ?? r.document_id;
      if (id == null) return null;
      return {
        id: String(id),
        application_id: String(r.application_id ?? ""),
        document_type: String(r.document_type ?? r.type ?? ""),
        document_category: String(r.document_category ?? r.category ?? ""),
        file_url: String(r.file_url ?? r.url ?? ""),
        file_name:
          r.file_name != null ? String(r.file_name) : undefined,
        upload_status: String(r.upload_status ?? "uploaded"),
        verification_status: String(r.verification_status ?? "pending"),
        uploaded_at: String(r.uploaded_at ?? r.created_at ?? ""),
      };
    })
    .filter((x): x is CreditDocument => x != null);
}

/** GET .../narrative */
export async function getNarrative(
  tenantId: string,
  applicationId: string
): Promise<NarrativeResult> {
  const tid = requireTenant(tenantId);
  const res = await fetch(
    `${BACKEND_URL}/api/v2/credit/applications/${encodeURIComponent(applicationId)}/narrative`,
    { headers: baseHeaders(tid, false) }
  );
  return handleJson<NarrativeResult>(res);
}

/** POST /api/v2/credit/demo/load */
export async function loadDemoCase(
  tenantId: string,
  caseType: "prime" | "review" | "high_risk"
): Promise<DemoLoadResult> {
  const tid = requireTenant(tenantId);
  const res = await fetch(`${BACKEND_URL}/api/v2/credit/demo/load`, {
    method: "POST",
    headers: baseHeaders(tid, true),
    body: JSON.stringify({ case_type: caseType }),
  });
  const detail = await parseDetail(res);
  if (res.status === 403) {
    throw new CreditApiError("demo_disabled", 403, detail);
  }
  if (!res.ok) {
    const msg = humanMessage(res.status, detail);
    throw new CreditApiError(msg, res.status, detail);
  }
  return detail as DemoLoadResult;
}

/** POST .../documents/upload (multipart) */
export async function uploadDocument(
  tenantId: string,
  applicationId: string,
  file: File,
  documentType: string
): Promise<CreditDocument> {
  const tid = requireTenant(tenantId);
  const form = new FormData();
  form.append("file", file);
  form.append("document_type", documentType);
  const res = await fetch(
    `${BACKEND_URL}/api/v2/credit/applications/${encodeURIComponent(applicationId)}/documents/upload`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "X-Tenant-ID": tid,
      },
      body: form,
    }
  );
  const detail = await parseDetail(res);
  if (!res.ok) {
    const msg = humanMessage(res.status, detail);
    throw new CreditApiError(msg, res.status, detail);
  }
  const arr = normalizeCreditDocuments(detail);
  if (arr.length > 0) return arr[0]!;
  if (detail && typeof detail === "object" && !Array.isArray(detail)) {
    const single = normalizeCreditDocuments([detail]);
    if (single.length > 0) return single[0]!;
  }
  throw new CreditApiError("Respuesta de subida inválida", res.status, detail);
}

/** GET .../documents */
export async function listDocuments(
  tenantId: string,
  applicationId: string
): Promise<CreditDocument[]> {
  const tid = requireTenant(tenantId);
  const res = await fetch(
    `${BACKEND_URL}/api/v2/credit/applications/${encodeURIComponent(applicationId)}/documents`,
    { headers: baseHeaders(tid, false) }
  );
  const detail = await parseDetail(res);
  if (!res.ok) {
    const msg = humanMessage(res.status, detail);
    throw new CreditApiError(msg, res.status, detail);
  }
  return normalizeCreditDocuments(detail);
}

/** GET .../documents/completeness */
export async function getDocumentCompleteness(
  tenantId: string,
  applicationId: string
): Promise<DocumentCompleteness> {
  const tid = requireTenant(tenantId);
  const res = await fetch(
    `${BACKEND_URL}/api/v2/credit/applications/${encodeURIComponent(applicationId)}/documents/completeness`,
    { headers: baseHeaders(tid, false) }
  );
  return handleJson<DocumentCompleteness>(res);
}

/** GET .../wizard/status */
export async function getWizardStatus(
  tenantId: string,
  applicationId: string
): Promise<WizardStatus> {
  const tid = requireTenant(tenantId);
  const res = await fetch(
    `${BACKEND_URL}/api/v2/credit/applications/${encodeURIComponent(applicationId)}/wizard/status`,
    { headers: baseHeaders(tid, false) }
  );
  return handleJson<WizardStatus>(res);
}

/** GET .../consistency */
export async function getConsistencyScore(
  tenantId: string,
  applicationId: string
): Promise<ConsistencyResult> {
  const tid = requireTenant(tenantId);
  const res = await fetch(
    `${BACKEND_URL}/api/v2/credit/applications/${encodeURIComponent(applicationId)}/consistency`,
    { headers: baseHeaders(tid, false) }
  );
  return handleJson<ConsistencyResult>(res);
}

/** POST .../consents */
export async function saveConsents(
  tenantId: string,
  applicationId: string,
  consents: Record<string, boolean>
): Promise<void> {
  const tid = requireTenant(tenantId);
  const res = await fetch(
    `${BACKEND_URL}/api/v2/credit/applications/${encodeURIComponent(applicationId)}/consents`,
    {
      method: "POST",
      headers: baseHeaders(tid, true),
      body: JSON.stringify(consents),
    }
  );
  const detail = await parseDetail(res);
  if (!res.ok) {
    const msg = humanMessage(res.status, detail);
    throw new CreditApiError(msg, res.status, detail);
  }
}

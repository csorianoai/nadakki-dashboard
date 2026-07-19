import type {
  AvailableActionsResponse,
  CaseTimelineEvent,
  CreateCasePayload,
  DisasterLevel,
  GenerateDocumentRequestBody,
  GeneratedDocumentDetail,
  GeneratedDocumentDraftResponse,
  GeneratedDocumentsListResponse,
  GeneratedDocumentListItem,
  LegalCase,
  ListCasesResponse,
  RiskProfile,
} from "@/lib/legal/cases/case-types";
import {
  normalizeAvailableActions,
  normalizeStateTransitions,
} from "@/lib/legal/cases/normalize-available-actions";
import { LegalApiHttpError, readLegalJson } from "@/lib/legal/parse-api-error";

const LEGAL_PREFIX = "/api/legal";

function tenantHeaders(tenantId: string): HeadersInit {
  return {
    "X-Tenant-ID": tenantId.trim(),
    Accept: "application/json",
  };
}

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

function normalizeListPayload(raw: unknown): ListCasesResponse {
  if (!raw || typeof raw !== "object") return { cases: [], total: 0 };
  const o = raw as Record<string, unknown>;
  const arr =
    (Array.isArray(o.cases) ? o.cases : null) ||
    (Array.isArray(o.items) ? o.items : null) ||
    (Array.isArray(o.data) ? o.data : null) ||
    (Array.isArray(raw) ? (raw as LegalCase[]) : null);
  const cases = (arr ?? []) as LegalCase[];
  const total =
    typeof o.total === "number"
      ? o.total
      : typeof o.count === "number"
        ? o.count
        : cases.length;
  return { cases, total };
}

function normalizeCase(raw: unknown): LegalCase | null {
  if (!raw || typeof raw !== "object") return null;
  return raw as LegalCase;
}

export async function fetchCasesList(
  tenantId: string,
  params: Record<string, string | number | undefined>
): Promise<ListCasesResponse> {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") q.set(k, String(v));
  });
  const qs = q.toString();
  const url = `${LEGAL_PREFIX}/cases${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, { headers: tenantHeaders(tenantId) });
  if (!res.ok) throw new Error(`Error al cargar expedientes (${res.status})`);
  const raw = await parseJson<unknown>(res);
  return normalizeListPayload(raw);
}

export async function fetchCaseDetail(tenantId: string, caseId: string): Promise<LegalCase> {
  const res = await fetch(`${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}`, {
    headers: { ...tenantHeaders(tenantId), "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Error al cargar expediente (${res.status})`);
  const raw = await parseJson<unknown>(res);
  const c = normalizeCase(raw);
  if (!c) throw new Error("Respuesta de expediente inválida");
  return c;
}

export async function createCase(tenantId: string, body: CreateCasePayload): Promise<LegalCase> {
  const res = await fetch(`${LEGAL_PREFIX}/cases`, {
    method: "POST",
    headers: { ...tenantHeaders(tenantId), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Error al crear expediente (${res.status})`);
  const raw = await parseJson<unknown>(res);
  const c = normalizeCase(raw);
  if (!c) throw new Error("Respuesta de creación inválida");
  return c;
}

export async function fetchAvailableActions(
  tenantId: string,
  caseId: string
): Promise<AvailableActionsResponse> {
  const c = await fetchCaseDetail(tenantId, caseId);
  return {
    current_state: c.state,
    available_actions: normalizeAvailableActions(c.available_actions),
    transitions_available: normalizeStateTransitions(c.allowed_transitions),
  };
}

export async function postCaseAction(
  tenantId: string,
  caseId: string,
  actionName: string,
  payload: Record<string, unknown> = {},
  actorType: "human" | "agent" | "system" = "human",
): Promise<unknown> {
  const res = await fetch(`${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/actions`, {
    method: "POST",
    headers: { ...tenantHeaders(tenantId), "Content-Type": "application/json" },
    body: JSON.stringify({ action: actionName, actor_type: actorType, payload }),
  });
  return readLegalJson<unknown>(res, "Error al ejecutar acción");
}

export async function patchCaseState(
  tenantId: string,
  caseId: string,
  body: { new_state: string; reason: string; legal_basis?: string },
): Promise<unknown> {
  const res = await fetch(`${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/state`, {
    method: "PATCH",
    headers: { ...tenantHeaders(tenantId), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return readLegalJson<unknown>(res, "Error al cambiar estado");
}

export async function fetchTimeline(
  tenantId: string,
  caseId: string
): Promise<{ events: CaseTimelineEvent[] }> {
  const res = await fetch(`${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/events`, {
    headers: tenantHeaders(tenantId),
  });
  if (!res.ok) throw new Error(`Error al cargar línea de tiempo (${res.status})`);
  const raw = await parseJson<Record<string, unknown>>(res);
  const events = Array.isArray(raw.events) ? (raw.events as CaseTimelineEvent[]) : [];
  return { events };
}

export async function fetchDeadlines(tenantId: string, caseId: string) {
  const res = await fetch(`${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/deadlines`, {
    headers: tenantHeaders(tenantId),
  });
  if (!res.ok) throw new Error(`Error al cargar plazos (${res.status})`);
  const raw = await parseJson<Record<string, unknown>>(res);
  const deadlines = Array.isArray(raw.deadlines) ? raw.deadlines : Array.isArray(raw) ? raw : [];
  return { deadlines };
}

export async function postDeadlineOverride(
  tenantId: string,
  caseId: string,
  deadlineId: string,
  body: { new_deadline_date: string; reason: string; legal_basis: string }
) {
  const res = await fetch(
    `${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/deadlines/${encodeURIComponent(deadlineId)}/override`,
    {
      method: "PATCH",
      headers: { ...tenantHeaders(tenantId), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) throw new Error(`Error al modificar plazo (${res.status})`);
  return parseJson<unknown>(res);
}

export async function fetchStrategies(tenantId: string, caseId: string) {
  const res = await fetch(`${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/strategies`, {
    headers: tenantHeaders(tenantId),
  });
  if (!res.ok) throw new Error(`Error al cargar estrategias (${res.status})`);
  return parseJson<unknown>(res);
}

export async function postStrategiesSelect(
  tenantId: string,
  caseId: string,
  body: { strategy_ids: string[]; rationale?: string; generate_documents_immediately?: boolean }
) {
  const res = await fetch(`${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/strategies/select`, {
    method: "POST",
    headers: { ...tenantHeaders(tenantId), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Error al seleccionar estrategias (${res.status})`);
  return parseJson<unknown>(res);
}

export async function fetchDocuments(tenantId: string, caseId: string) {
  const res = await fetch(`${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}`, {
    headers: tenantHeaders(tenantId),
  });
  if (!res.ok) throw new Error(`Error al cargar documentos (${res.status})`);
  const c = await parseJson<LegalCase>(res);
  return { documents: c.documents ?? [] };
}

export async function patchDocumentLifecycle(
  tenantId: string,
  caseId: string,
  docId: string,
  body: { new_status: string; notes?: string; submitted_to_court_acuse?: string }
) {
  const res = await fetch(
    `${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/documents/${encodeURIComponent(docId)}/lifecycle`,
    {
      method: "PATCH",
      headers: { ...tenantHeaders(tenantId), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) throw new Error(`Error al actualizar documento (${res.status})`);
  return parseJson<unknown>(res);
}

export async function postVerifyExtractedData(
  tenantId: string,
  caseId: string,
  docId: string,
  body: Record<string, unknown>
) {
  const res = await fetch(
    `${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/documents/${encodeURIComponent(docId)}/verify_extracted_data`,
    {
      method: "POST",
      headers: { ...tenantHeaders(tenantId), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  return readLegalJson<unknown>(res, "Error al verificar datos extraídos");
}

export async function fetchIssues(tenantId: string, caseId: string) {
  const res = await fetch(`${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/issues`, {
    headers: tenantHeaders(tenantId),
  });
  if (!res.ok) throw new Error(`Error al cargar incidencias (${res.status})`);
  const raw = await parseJson<Record<string, unknown>>(res);
  const issues = Array.isArray(raw.issues) ? raw.issues : [];
  return { issues };
}

export async function postIssue(tenantId: string, caseId: string, body: Record<string, unknown>) {
  const res = await fetch(`${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/issues`, {
    method: "POST",
    headers: { ...tenantHeaders(tenantId), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Error al reportar incidencia (${res.status})`);
  return parseJson<unknown>(res);
}

export async function patchIssue(
  tenantId: string,
  caseId: string,
  issueId: string,
  body: Record<string, unknown>
) {
  const res = await fetch(
    `${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/issues/${encodeURIComponent(issueId)}/resolve`,
    {
      method: "PATCH",
      headers: { ...tenantHeaders(tenantId), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) throw new Error(`Error al actualizar incidencia (${res.status})`);
  return parseJson<unknown>(res);
}

export async function fetchAuditChainVerification(tenantId: string, caseId: string) {
  const res = await fetch(
    `${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/audit_chain_verification`,
    { headers: tenantHeaders(tenantId) },
  );
  return readLegalJson<unknown>(res, "Error al verificar cadena de auditoría");
}

export async function fetchSnapshots(tenantId: string, caseId: string) {
  const res = await fetch(`${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/snapshots`, {
    headers: tenantHeaders(tenantId),
  });
  if (!res.ok) throw new Error(`Error al cargar versiones (${res.status})`);
  const raw = await parseJson<unknown>(res);
  if (Array.isArray(raw)) return { snapshots: raw };
  if (raw && typeof raw === "object" && Array.isArray((raw as { snapshots?: unknown }).snapshots)) {
    return { snapshots: (raw as { snapshots: unknown[] }).snapshots };
  }
  return { snapshots: [] };
}

export async function fetchSnapshotDetail(tenantId: string, caseId: string, snapshotId: string) {
  const res = await fetch(
    `${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/snapshots/${encodeURIComponent(snapshotId)}`,
    { headers: tenantHeaders(tenantId) }
  );
  return readLegalJson<unknown>(res, "Error al cargar versión");
}

export async function fetchSnapshotVerify(tenantId: string, caseId: string) {
  const res = await fetch(
    `${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/snapshots/verify`,
    { headers: tenantHeaders(tenantId) }
  );
  return readLegalJson<unknown>(res, "Error al verificar cadena de snapshots");
}

export async function fetchSnapshotDiff(
  tenantId: string,
  caseId: string,
  snapshotIdA: string,
  snapshotIdB: string,
) {
  const q = new URLSearchParams({
    snapshot_id_a: snapshotIdA,
    snapshot_id_b: snapshotIdB,
  });
  const res = await fetch(
    `${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/snapshots/diff?${q.toString()}`,
    { headers: tenantHeaders(tenantId) }
  );
  return readLegalJson<unknown>(res, "Error al calcular diff de snapshots");
}

export async function postSnapshot(tenantId: string, caseId: string, body: Record<string, unknown>) {
  const res = await fetch(`${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/snapshots`, {
    method: "POST",
    headers: { ...tenantHeaders(tenantId), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Error al crear versión (${res.status})`);
  return parseJson<unknown>(res);
}

export async function fetchRisk(tenantId: string, caseId: string): Promise<RiskProfile | null> {
  const res = await fetch(`${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/risk`, {
    headers: tenantHeaders(tenantId),
  });
  if (!res.ok) throw new Error(`Error al cargar riesgo (${res.status})`);
  const raw = await parseJson<unknown>(res);
  if (raw && typeof raw === "object" && "overall_risk_score" in raw) {
    return raw as RiskProfile;
  }
  const nested =
    raw && typeof raw === "object" && "risk_profile" in raw
      ? (raw as { risk_profile?: RiskProfile }).risk_profile
      : null;
  return nested ?? null;
}

export async function postLock(
  tenantId: string,
  caseId: string,
  body: { lock_reason: string; lock_scope: string; duration_minutes: number }
) {
  const res = await fetch(`${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/lock`, {
    method: "POST",
    headers: { ...tenantHeaders(tenantId), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Error al bloquear expediente (${res.status})`);
  return parseJson<{ lock_id?: string }>(res);
}

export async function deleteLock(tenantId: string, caseId: string) {
  const res = await fetch(`${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/lock`, {
    method: "DELETE",
    headers: tenantHeaders(tenantId),
  });
  if (!res.ok && res.status !== 404) throw new Error(`Error al liberar bloqueo (${res.status})`);
}

export async function fetchRelated(tenantId: string, caseId: string) {
  const res = await fetch(`${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/related`, {
    headers: tenantHeaders(tenantId),
  });
  if (!res.ok) throw new Error(`Error al cargar relacionados (${res.status})`);
  return parseJson<unknown>(res);
}

export async function postArchive(tenantId: string, caseId: string, body: Record<string, unknown> = {}) {
  const res = await fetch(`${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/archive`, {
    method: "POST",
    headers: { ...tenantHeaders(tenantId), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return readLegalJson<unknown>(res, "Error al archivar expediente");
}

export async function ingestDocument(
  tenantId: string,
  caseId: string,
  formData: FormData
): Promise<unknown> {
  const res = await fetch(`${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/documents`, {
    method: "POST",
    headers: { "X-Tenant-ID": tenantId.trim() },
    body: formData,
  });
  if (!res.ok) throw new Error(`Error al subir documento (${res.status})`);
  return parseJson<unknown>(res);
}

export async function postGenerateDocument(
  tenantId: string,
  caseId: string,
  body: GenerateDocumentRequestBody
): Promise<GeneratedDocumentDraftResponse> {
  const res = await fetch(
    `${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/documents/generate`,
    {
      method: "POST",
      headers: { ...tenantHeaders(tenantId), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) throw new Error(`Error al generar documento (${res.status})`);
  const raw = await parseJson<Record<string, unknown>>(res);
  const document_id =
    typeof raw.document_id === "string" ? raw.document_id : (raw.id as string | undefined);
  if (!document_id) throw new Error("Respuesta de generación incompleta");
  const attorney_validated = Boolean(raw.attorney_validated);
  return {
    document_id,
    status: "draft" as const,
    attorney_validated,
    content: typeof raw.content === "string" ? raw.content : undefined,
  };
}

export async function fetchGeneratedDocuments(
  tenantId: string,
  caseId: string
): Promise<GeneratedDocumentsListResponse> {
  const res = await fetch(
    `${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/documents/generated`,
    { headers: tenantHeaders(tenantId) }
  );
  if (!res.ok) throw new Error(`Error al cargar documentos generados (${res.status})`);
  const raw = await parseJson<Record<string, unknown>>(res);
  const docs = Array.isArray(raw.documents)
    ? (raw.documents as GeneratedDocumentListItem[])
    : Array.isArray(raw.items)
      ? (raw.items as GeneratedDocumentListItem[])
      : [];
  const count = typeof raw.count === "number" ? raw.count : docs.length;
  return { documents: docs, count };
}

export async function fetchGeneratedDocument(
  tenantId: string,
  caseId: string,
  docId: string
): Promise<GeneratedDocumentDetail> {
  const res = await fetch(
    `${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/documents/generated/${encodeURIComponent(docId)}`,
    { headers: tenantHeaders(tenantId) }
  );
  if (!res.ok) throw new Error(`Error al cargar documento (${res.status})`);
  const raw = await parseJson<Record<string, unknown>>(res);
  const document_id = typeof raw.document_id === "string" ? raw.document_id : docId;
  const document_type = typeof raw.document_type === "string" ? raw.document_type : "";
  const content = typeof raw.content === "string" ? raw.content : "";
  const attorney_validated = Boolean(raw.attorney_validated);
  const generated_at = typeof raw.generated_at === "string" ? raw.generated_at : undefined;
  const citations = raw.citations;
  return { document_id, document_type, content, attorney_validated, generated_at, citations };
}

// ─── Deadline Notifications (Phase 3) ───────────────────────────────

export async function fetchUpcomingDeadlines(
  tenantId: string,
  horizonDays: number = 30,
  includeAcknowledged: boolean = false,
): Promise<{ deadlines: Record<string, unknown>[]; count: number; horizon_days: number }> {
  const q = new URLSearchParams();
  q.set("horizon_days", String(horizonDays));
  if (includeAcknowledged) q.set("include_acknowledged", "true");
  const res = await fetch(`${LEGAL_PREFIX}/deadlines/upcoming?${q.toString()}`, {
    headers: tenantHeaders(tenantId),
  });
  if (!res.ok) throw new Error(`Error al cargar plazos próximos (${res.status})`);
  const raw = await parseJson<Record<string, unknown>>(res);
  const deadlines = Array.isArray(raw.deadlines) ? raw.deadlines : [];
  const count = typeof raw.count === "number" ? raw.count : deadlines.length;
  const horizon_days = typeof raw.horizon_days === "number" ? raw.horizon_days : horizonDays;
  return { deadlines, count, horizon_days };
}

export async function postAcknowledgeDeadline(
  tenantId: string,
  deadlineId: string,
  acknowledgedBy: string,
): Promise<unknown> {
  const res = await fetch(
    `${LEGAL_PREFIX}/deadlines/${encodeURIComponent(deadlineId)}/acknowledge`,
    {
      method: "POST",
      headers: { ...tenantHeaders(tenantId), "Content-Type": "application/json" },
      body: JSON.stringify({ acknowledged_by: acknowledgedBy }),
    },
  );
  if (!res.ok) throw new Error(`Error al confirmar plazo (${res.status})`);
  return parseJson<unknown>(res);
}

// ─── Document Versioning (Phase 4) ──────────────────────────────────

export async function fetchDocumentVersions(
  tenantId: string,
  caseId: string,
  documentId: string,
): Promise<{ versions: Record<string, unknown>[]; count: number; document_id: string }> {
  const res = await fetch(
    `${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/documents/${encodeURIComponent(documentId)}/versions`,
    { headers: tenantHeaders(tenantId) },
  );
  if (!res.ok) throw new Error(`Error al cargar versiones (${res.status})`);
  const raw = await parseJson<Record<string, unknown>>(res);
  const versions = Array.isArray(raw.versions) ? raw.versions : [];
  const count = typeof raw.count === "number" ? raw.count : versions.length;
  return { versions, count, document_id: documentId };
}

export async function postDocumentVersion(
  tenantId: string,
  caseId: string,
  documentId: string,
  body: { content: string; createdBy?: string; reason?: string },
): Promise<unknown> {
  const res = await fetch(
    `${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/documents/${encodeURIComponent(documentId)}/versions`,
    {
      method: "POST",
      headers: { ...tenantHeaders(tenantId), "Content-Type": "application/json" },
      body: JSON.stringify({
        content: body.content,
        created_by: body.createdBy,
        reason: body.reason,
      }),
    },
  );
  if (!res.ok) throw new Error(`Error al crear versión (${res.status})`);
  return parseJson<unknown>(res);
}

// ─── PDF Export (Phase 5) ───────────────────────────────────────────

export function getPdfExportUrl(caseId: string, documentId: string): string {
  return `${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/documents/${encodeURIComponent(documentId)}/pdf`;
}

/** Modo degradado: endpoint opcional; si no existe, se asume NORMAL. */
export async function fetchDisasterMode(tenantId: string): Promise<{ level: DisasterLevel }> {
  const res = await fetch(`${LEGAL_PREFIX}/meta/disaster-mode`, {
    method: "GET",
    headers: tenantHeaders(tenantId),
  });
  if (!res.ok) return { level: "NORMAL" };
  const raw = await parseJson<Record<string, unknown>>(res);
  const level = raw.level as DisasterLevel | undefined;
  if (
    level === "LLM_DEGRADED" ||
    level === "RAG_DEGRADED" ||
    level === "CRITICAL_FALLBACK" ||
    level === "NORMAL"
  ) {
    return { level };
  }
  return { level: "NORMAL" };
}

// ─── Strategy Comparator (Phase 6) ─────────────────────────────────

export interface StrategyComparisonEntry {
  case_id: string;
  case_title: string | null;
  case_type: string | null;
  state: string | null;
  strategies: {
    strategy_id: string;
    strategy_type: string;
    title: string;
    expected_strength: string;
    expected_duration_days: number;
    risks: string[];
    selected: boolean;
  }[];
  strategy_count: number;
  error: string | null;
}

export interface StrategyComparisonResponse {
  comparisons: StrategyComparisonEntry[];
  case_count: number;
  strategy_types_across_cases: string[];
}

export async function fetchStrategyComparison(
  tenantId: string,
  caseIds: string[],
): Promise<StrategyComparisonResponse> {
  const ids = caseIds.filter((id) => id.trim()).join(",");
  const res = await fetch(
    `${LEGAL_PREFIX}/strategies/compare?case_ids=${encodeURIComponent(ids)}`,
    { headers: tenantHeaders(tenantId) },
  );
  if (!res.ok) throw new Error(`Error al comparar estrategias (${res.status})`);
  const raw = await parseJson<Record<string, unknown>>(res);
  const comparisons = Array.isArray(raw.comparisons) ? raw.comparisons : [];
  return {
    comparisons: comparisons as StrategyComparisonEntry[],
    case_count: typeof raw.case_count === "number" ? raw.case_count : comparisons.length,
    strategy_types_across_cases: Array.isArray(raw.strategy_types_across_cases)
      ? (raw.strategy_types_across_cases as string[])
      : [],
  };
}

// ─── Jurisdictions (Phase 7) ────────────────────────────────────────

export interface Jurisdiction {
  code: string;
  name: string;
  status: string;
  version: string;
  description: string;
}

export interface JurisdictionsResponse {
  jurisdictions: Jurisdiction[];
  count: number;
}

export interface KnowledgePackStatus {
  jurisdiction: string;
  pack_status: string;
  pack_hash: string;
  leyes_cargadas: number;
  articulos_level_1: number;
  last_loaded_at: string;
  is_skeleton: boolean;
}

export async function fetchJurisdictions(
  tenantId: string,
): Promise<JurisdictionsResponse> {
  const res = await fetch(`${LEGAL_PREFIX}/jurisdictions`, {
    headers: tenantHeaders(tenantId),
  });
  if (!res.ok) throw new Error(`Error al cargar jurisdicciones (${res.status})`);
  const raw = await parseJson<Record<string, unknown>>(res);
  const jurisdictions = Array.isArray(raw.jurisdictions) ? raw.jurisdictions : [];
  return {
    jurisdictions: jurisdictions as Jurisdiction[],
    count: typeof raw.count === "number" ? raw.count : jurisdictions.length,
  };
}

export async function fetchKnowledgePackStatus(
  tenantId: string,
  jurisdiction: string = "do",
): Promise<KnowledgePackStatus> {
  const res = await fetch(
    `${LEGAL_PREFIX}/knowledge-pack/status?jurisdiction=${encodeURIComponent(jurisdiction)}`,
    { headers: tenantHeaders(tenantId) },
  );
  if (!res.ok) throw new Error(`Error al cargar estado knowledge pack (${res.status})`);
  const raw = await parseJson<Record<string, unknown>>(res);
  return {
    jurisdiction: (raw.jurisdiction as string) ?? jurisdiction.toUpperCase(),
    pack_status: (raw.pack_status as string) ?? "unknown",
    pack_hash: (raw.pack_hash as string) ?? "",
    leyes_cargadas: typeof raw.leyes_cargadas === "number" ? raw.leyes_cargadas : 0,
    articulos_level_1: typeof raw.articulos_level_1 === "number" ? raw.articulos_level_1 : 0,
    last_loaded_at: (raw.last_loaded_at as string) ?? "",
    is_skeleton: Boolean(raw.is_skeleton),
  };
}

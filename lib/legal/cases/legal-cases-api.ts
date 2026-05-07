import type {
  AvailableActionsResponse,
  CaseTimelineEvent,
  CreateCasePayload,
  DisasterLevel,
  LegalCase,
  ListCasesResponse,
  RiskProfile,
} from "@/lib/legal/cases/case-types";

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
  const res = await fetch(
    `${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/available_actions`,
    { headers: tenantHeaders(tenantId) }
  );
  if (!res.ok) throw new Error(`Error al cargar acciones (${res.status})`);
  return parseJson<AvailableActionsResponse>(res);
}

export async function postCaseAction(
  tenantId: string,
  caseId: string,
  actionName: string,
  payload: Record<string, unknown> = {}
): Promise<unknown> {
  const res = await fetch(
    `${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/actions/${encodeURIComponent(actionName)}`,
    {
      method: "POST",
      headers: { ...tenantHeaders(tenantId), "Content-Type": "application/json" },
      body: JSON.stringify({ action_name: actionName, payload }),
    }
  );
  if (!res.ok) throw new Error(`Error al ejecutar acción (${res.status})`);
  return parseJson<unknown>(res);
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
  if (!res.ok) throw new Error(`Error al verificar datos (${res.status})`);
  return parseJson<unknown>(res);
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

export async function fetchSnapshots(tenantId: string, caseId: string) {
  const res = await fetch(`${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/snapshots`, {
    headers: tenantHeaders(tenantId),
  });
  if (!res.ok) throw new Error(`Error al cargar versiones (${res.status})`);
  const raw = await parseJson<Record<string, unknown>>(res);
  const snapshots = Array.isArray(raw.snapshots) ? raw.snapshots : [];
  return { snapshots };
}

export async function fetchSnapshotDetail(tenantId: string, caseId: string, snapshotId: string) {
  const res = await fetch(
    `${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/snapshots/${encodeURIComponent(snapshotId)}`,
    { headers: tenantHeaders(tenantId) }
  );
  if (!res.ok) throw new Error(`Error al cargar versión (${res.status})`);
  return parseJson<unknown>(res);
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
  if (!res.ok) throw new Error(`Error al archivar (${res.status})`);
  return parseJson<unknown>(res);
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

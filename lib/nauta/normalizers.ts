import type {
  NautaEmployee,
  NautaEvidence,
  NautaRunCost,
  NautaRunDetail,
  NautaRunStep,
  NautaRunSummary,
  NautaRunsListResponse,
  NautaTemplate,
} from "./types";

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : v != null ? String(v) : fallback;
}

function num(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function bool(v: unknown, fallback = false): boolean {
  return typeof v === "boolean" ? v : fallback;
}

export function normalizeEmployee(raw: unknown): NautaEmployee | null {
  const o = asRecord(raw);
  if (!o) return null;
  const id = str(o.id);
  if (!id) return null;
  return {
    id,
    role_id: str(o.role_id),
    role_name: str(o.role_name),
    department_id: str(o.department_id),
    status: str(o.status, "offline"),
  };
}

export function normalizeEmployees(raw: unknown): NautaEmployee[] {
  const root = asRecord(raw);
  const arr =
    asArray(raw).length > 0
      ? asArray(raw)
      : asArray(root?.employees ?? root?.items ?? root?.data);
  return arr.map(normalizeEmployee).filter((e): e is NautaEmployee => e != null);
}

export function normalizeTemplate(raw: unknown): NautaTemplate | null {
  const o = asRecord(raw);
  if (!o) return null;
  const taskName = str(o.task_name ?? o.task_name_slug ?? o.slug);
  const name = str(o.name) || taskName;
  const id = str(o.id) || taskName || name;
  if (!id) return null;
  return {
    id,
    role_id: str(o.role_id),
    name,
    task_name: taskName || name,
    risk_level: str(o.risk_level, "medium"),
    status: str(o.status, "published"),
  };
}

export function normalizeTemplates(raw: unknown): NautaTemplate[] {
  const root = asRecord(raw);
  const arr =
    asArray(raw).length > 0
      ? asArray(raw)
      : asArray(root?.templates ?? root?.items ?? root?.data);
  return arr.map(normalizeTemplate).filter((t): t is NautaTemplate => t != null);
}

export function normalizeRunSummary(raw: unknown): NautaRunSummary | null {
  const o = asRecord(raw);
  if (!o) return null;
  const id = str(o.id ?? o.run_id);
  if (!id) return null;
  return {
    id,
    employee_id: str(o.employee_id),
    role_name: str(o.role_name),
    task_name: str(o.task_name),
    status: str(o.status),
    risk_level: str(o.risk_level, "medium"),
    success: bool(o.success),
    hours_saved_estimate: num(o.hours_saved_estimate),
    findings_count: num(o.findings_count),
    evidence_count: num(o.evidence_count),
    created_at: str(o.created_at),
  };
}

export function normalizeRunsList(raw: unknown, pageFallback = 1): NautaRunsListResponse {
  const root = asRecord(raw);
  if (!root) {
    return { items: [], total: 0, page: pageFallback };
  }
  const arr = asArray(root.items ?? root.runs ?? root.data ?? raw);
  const items = arr.map(normalizeRunSummary).filter((r): r is NautaRunSummary => r != null);
  const total = num(root.total ?? root.total_count ?? items.length);
  const page = num(root.page, pageFallback) || pageFallback;
  return { items, total, page };
}

function normalizeStep(raw: unknown): NautaRunStep | null {
  const o = asRecord(raw);
  if (!o) return null;
  const id = str(o.id ?? o.step_id, "step");
  return {
    id,
    label: str(o.label ?? o.name ?? o.step_name),
    status: str(o.status),
    started_at: o.started_at ? str(o.started_at) : undefined,
    ended_at: o.ended_at ? str(o.ended_at) : undefined,
  };
}

export function normalizeEvidence(raw: unknown): NautaEvidence | null {
  const o = asRecord(raw);
  if (!o) return null;
  const hash = str(o.artifact_hash_sha256 ?? o.hash_sha256);
  if (!hash) return null;
  return {
    artifact_type: str(o.artifact_type),
    artifact_hash_sha256: hash,
    source_url: str(o.source_url),
    captured_at: str(o.captured_at),
  };
}

export function normalizeEvidenceList(raw: unknown): NautaEvidence[] {
  const root = asRecord(raw);
  const arr =
    asArray(raw).length > 0
      ? asArray(raw)
      : asArray(root?.evidence ?? root?.items ?? root?.data);
  return arr.map(normalizeEvidence).filter((e): e is NautaEvidence => e != null);
}

function normalizeCost(raw: unknown): NautaRunCost {
  const o = asRecord(raw);
  if (!o) return { tokens: 0, cost_usd: 0 };
  return {
    tokens: num(o.tokens),
    cost_usd: num(o.cost_usd ?? o.cost),
  };
}

export function normalizeRunDetail(raw: unknown): NautaRunDetail | null {
  const root = asRecord(raw);
  if (!root) return null;
  const runObj = asRecord(root.run) ?? root;
  const summary = normalizeRunSummary(runObj);
  if (!summary) return null;
  const stepsRaw = asArray(runObj.steps ?? root.steps);
  const evidenceRaw = runObj.evidence ?? root.evidence;
  const costRaw = runObj.cost ?? root.cost;
  return {
    ...summary,
    steps: stepsRaw.map(normalizeStep).filter((s): s is NautaRunStep => s != null),
    evidence: evidenceRaw ? normalizeEvidenceList(evidenceRaw) : [],
    cost: normalizeCost(costRaw),
    live_url: runObj.live_url != null ? str(runObj.live_url) : root.live_url != null ? str(root.live_url) : null,
  };
}

/** Nauta Fase C — contract types (fixed; do not extend without ADR). */

export type NautaEmployeeStatus = "active" | "idle" | "paused" | "offline" | string;
export type NautaRiskLevel = "low" | "medium" | "high" | "critical" | string;
export type NautaRunStatus =
  | "completed"
  | "running"
  | "failed"
  | "pending_approval"
  | "approved"
  | "rejected"
  | string;

export interface NautaEmployee {
  id: string;
  role_id: string;
  role_name: string;
  department_id: string;
  status: NautaEmployeeStatus;
}

export interface NautaTemplate {
  id: string;
  role_id: string;
  /** Display label from API `name` when present. */
  name: string;
  /** Backend POST /runs identifier — often `task_name` slug (e.g. platform_auditor_smoke_test). */
  task_name: string;
  risk_level: NautaRiskLevel;
  status: string;
}

/** Value sent as POST /runs `task_name`. */
export function resolveTemplateTaskName(t: NautaTemplate): string {
  return t.task_name.trim() || t.name.trim() || t.id.trim();
}

export interface NautaRunSummary {
  id: string;
  employee_id: string;
  role_name: string;
  task_name: string;
  status: NautaRunStatus;
  risk_level: NautaRiskLevel;
  success: boolean;
  hours_saved_estimate: number;
  findings_count: number;
  evidence_count: number;
  created_at: string;
}

export interface NautaRunsListResponse {
  items: NautaRunSummary[];
  total: number;
  page: number;
}

export interface NautaRunStep {
  id: string;
  label: string;
  status: string;
  started_at?: string;
  ended_at?: string;
}

export interface NautaEvidence {
  artifact_type: string;
  artifact_hash_sha256: string;
  source_url: string;
  captured_at: string;
}

export interface NautaRunCost {
  tokens: number;
  cost_usd: number;
}

export interface NautaRunDetail extends NautaRunSummary {
  steps: NautaRunStep[];
  evidence: NautaEvidence[];
  cost: NautaRunCost;
  /** Reserved for Fase C-live — not in list contract; optional on detail. */
  live_url?: string | null;
}

export interface NautaApproveResponse {
  id: string;
  decision: string;
  decided_at: string;
}

export interface NautaHealthResponse {
  status: "ok" | string;
}

export interface NautaRunsQuery {
  page?: number;
  limit?: number;
}

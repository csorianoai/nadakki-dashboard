/**
 * Tipos TypeScript del Nadakki Governance Core Sprint 1.
 *
 * CONGELADOS - coinciden 1:1 con schemas Pydantic en backend
 * (agents/governance/schemas/governance_schemas.py).
 *
 * NO modificar sin sincronizar con backend.
 */

export type Severity = "P0" | "P1" | "P2" | "P3" | "NONE";

export type Status =
  | "PASS"
  | "WARN"
  | "FAIL"
  | "ERROR"
  | "RUNNING"
  | "NONE";

export type CentinelaName = "seguridad" | "oauth" | "workflows" | "mocks";

export type Environment = "production" | "staging" | "development";

export interface EvidenceFinding {
  command: string | null;
  output_preview: string | null;
}

export interface Finding {
  id: string;
  centinela: CentinelaName;
  severity: Severity;
  title: string;
  description: string;
  file_path: string | null;
  line_number: number | null;
  recommendation: string;
  blocking: boolean;
  evidence: EvidenceFinding;
  created_at: string;
}

export interface CentinelaResult {
  nombre: CentinelaName;
  status: Status;
  duration_ms: number;
  findings_count: number;
  max_severity: Severity;
  error_message: string | null;
}

export interface FindingsSummary {
  total: number;
  p0: number;
  p1: number;
  p2: number;
  p3: number;
}

export interface GovernanceReport {
  audit_id: string;
  timestamp: string;
  overall_status: Status;
  max_severity: Severity;
  environment: Environment;
  duration_ms: number;
  centinelas: CentinelaResult[];
  findings: Finding[];
  summary: FindingsSummary;
}

export interface GovernanceStatus {
  last_audit_id: string | null;
  last_run_at: string | null;
  is_running: boolean;
  current_audit_id: string | null;
}

export interface RunResponse {
  audit_id: string;
  status: "running";
  estimated_duration_seconds: number;
}

export const SEVERITY_ORDER: Record<Severity, number> = {
  P0: 4,
  P1: 3,
  P2: 2,
  P3: 1,
  NONE: 0,
};

export const SEVERITY_COLORS: Record<Severity, string> = {
  P0: "bg-rose-600 text-white",
  P1: "bg-amber-500 text-white",
  P2: "bg-slate-400 text-white",
  P3: "bg-slate-300 text-slate-700",
  NONE: "bg-emerald-500 text-white",
};

export const STATUS_COLORS: Record<Status, string> = {
  PASS: "bg-emerald-500",
  WARN: "bg-amber-500",
  FAIL: "bg-rose-600",
  ERROR: "bg-violet-600",
  RUNNING: "bg-blue-500",
  NONE: "bg-slate-400",
};

export const CENTINELA_LABELS: Record<CentinelaName, string> = {
  seguridad: "Centinela Seguridad",
  oauth: "Centinela OAuth",
  workflows: "Centinela Workflows",
  mocks: "Centinela Mocks",
};

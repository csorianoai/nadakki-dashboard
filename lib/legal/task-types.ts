/** Types mirroring backend legal tasks schema (Entregable A). Identifiers in English. */

export type LegalTaskInputType = "file" | "text" | "textarea" | "select";

export interface LegalTaskRequiredInput {
  field: string;
  type: LegalTaskInputType;
  formats?: string[];
  max_size_mb?: number;
  required?: boolean;
  label_es?: string;
}

export type LegalTaskOutputType = "structured_report" | "modal" | "navigate";

export type LegalTaskSyncMode = "sync" | "deep_async";

export type LegalTaskRiskLevel = "low" | "medium" | "high";

export interface LegalTask {
  task_id: string;
  display_name_es: string;
  display_name_en: string;
  description_es: string;
  description_en: string;
  section_es: string;
  section_en: string;
  icon_hint: string;
  agent_chain: string[];
  default_practice_area_tags: string[];
  required_inputs: LegalTaskRequiredInput[];
  output_type: LegalTaskOutputType;
  navigate_path?: string;
  requires_attorney_review: boolean;
  max_execution_time_ms: number;
  risk_level: LegalTaskRiskLevel;
  audit_required: boolean;
  min_knowledge_pack_level: string;
  fallback_action: string;
  sync_mode: LegalTaskSyncMode;
  tenant_features_required: string[];
  compliance_jurisdiction_scope: string[];
  estimated_time_es: string;
  estimated_time_en: string;
}

export type LegalTaskSectionEs = "Contratos" | "Litigios" | "Compliance" | "Investigación";

export function resolveTaskDisplayName(task: LegalTask): string {
  const es = task.display_name_es?.trim();
  if (es) return es;
  const en = task.display_name_en?.trim();
  return en ? `[EN] ${en}` : task.task_id;
}

export function resolveTaskDescription(task: LegalTask): string {
  const es = task.description_es?.trim();
  if (es) return es;
  const en = task.description_en?.trim();
  return en ? `[EN] ${en}` : "";
}

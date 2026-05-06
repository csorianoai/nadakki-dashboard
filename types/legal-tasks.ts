/**
 * Types for Legal Task System v2.2.
 * Worker B — Entregable C.
 * Matches api/legal/tasks schema in nadakki-ai-suite.
 */

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
  required_inputs: string[];
  output_type: string;
  requires_attorney_review: boolean;
  max_execution_time_ms: number;
  risk_level: "low" | "medium" | "high" | "critical";
  audit_required: boolean;
  min_knowledge_pack_level: number;
  fallback_action: string;
  sync_mode: "sync" | "async";
  tenant_features_required: string[];
  compliance_jurisdiction_scope: string[];
  estimated_time_es: string;
  estimated_time_en: string;
}

export interface LegalTaskListResponse {
  tenant_id: string;
  jurisdiction: string;
  total: number;
  tasks: LegalTask[];
  registry_hash: string;
}

export interface TaskExecutionRequest {
  task_id: string;
  inputs: Record<string, unknown>;
  dry_run?: boolean;
  practice_area_tags?: string[];
  webhook_url?: string;
}

export interface SealedOutput {
  estado: string;
  version: string;
  agent_id: string;
  tenant_id: string;
  timestamp: string;
  latencia_ms: number;
  decision: {
    accion: string;
    prioridad: string;
    confianza: number;
    explicacion: string;
    siguientes_pasos: string[];
  };
  estado_cumplimiento: string;
  puntaje_impacto_negocio: number;
  codigos_razon: Array<{
    codigo: string;
    categoria: string;
    descripcion: string;
    impacto: string;
  }>;
  etiquetas_area_practica: string[];
  requiere_revision_abogado: boolean;
  disclaimer_legal: {
    es: string;
    en?: string;
  };
  trazabilidad_auditoria: {
    knowledge_pack_id: string;
    knowledge_pack_version: string;
    knowledge_pack_hash: string;
    cadena_agentes: string[];
    execution_id: string;
    tenant_id: string;
    timestamp: string;
  };
  [key: string]: unknown;
}

export interface TaskExecutionResponse {
  task_id: string;
  task_display_name_es: string;
  task_display_name_en: string;
  execution_id: string;
  tenant_id: string;
  sealed_output: SealedOutput;
  timestamp: string;
}

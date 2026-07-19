/** Legal API contract metadata (Worker L). */
export const LEGAL_API_VERSION = "v1";
export const LEGAL_API_LAST_VALIDATED = "2026-04-30";
export const LEGAL_API_VALIDATED_COMMIT = "0fd6e8a4";

export interface LegalAgent {
  agent_id: string;
  name: string;
  category: string;
  description?: string;
  rag_enabled?: boolean;
  control_plane_enabled?: boolean;
  criticality?: "critical" | "high" | "medium" | "low";
  supported_inputs?: string[];
  output_schema_version?: string;
}

export interface Citation {
  source_id: string;
  law_name: string;
  article: string;
  layer: "capa_1" | "capa_2";
  quote_or_summary: string;
  /** Cuando el backend envía clasificación por área de práctica */
  practice_area_tags?: string[];
}

export interface RagMetadata {
  fuentes_capa_1_count?: number;
  fuentes_capa_2_count?: number;
  pack_hash?: string;
  latency_ms?: number;
  domain_filter_applied?: boolean;
  domain?: string;
  query_hash?: string;
}

export interface AgentMonitor {
  alertas?: string[];
  riesgo_evaluado?: "low" | "medium" | "high";
  latency_ms?: number;
}

export interface AgentRunAuditTrail {
  knowledge_pack_verified?: boolean;
  knowledge_pack_hash?: string;
  llm_mode?: string;
  validation_status?: string;
  strict_mode?: boolean;
  rejection_reason?: string;
}

export interface AgentRunResponse {
  agent_id: string;
  tenant_id: string;
  status: "success" | "error" | "timeout";
  request_id: string;
  respuesta: string;
  citations: Citation[];
  disclaimer_legal?: { es: string; en: string };
  requiere_revision_abogado: boolean;
  rag_metadata?: RagMetadata;
  monitor?: AgentMonitor;
  latency_ms?: number;
  follow_up_suggestions?: string[];
  /** Extended fields when backend exposes validation / mock metadata */
  audit_trail?: AgentRunAuditTrail;
  llm_metadata?: { provider?: string; model?: string; mode?: string; latency_ms?: number };
  metricas?: Record<string, unknown>;
  validation_status?: string;
  rejection_reason?: string;
}

export interface AuditTrailEntry {
  request_id: string;
  timestamp: string;
  tenant_id: string;
  agent_id: string;
  input_hash?: string;
  rag_metadata?: RagMetadata;
  llm_metadata?: { provider: string; model: string; latency_ms: number; tokens_used?: number };
  output_metadata?: { citations_count?: number; riesgo_legal?: string };
  monitor?: AgentMonitor;
  latency_total_ms?: number;
  status?: string;
  /** Áreas de práctica asociadas al evento (cuando el backend las provee) */
  practice_area_tags?: string[];
}

export interface KnowledgePackStatus {
  tenant_id: string;
  pack_hash?: string;
  leyes_cargadas?: number;
  articulos_cargados?: number;
  status?: string;
  last_loaded_at?: string;
}

export interface LegalHealthResponse {
  status: "healthy" | "degraded" | "down";
  checks?: Record<string, boolean>;
  version?: string;
  uptime_seconds?: number;
}

export interface LegalApiError {
  status: number;
  message: string;
  request_id?: string;
}

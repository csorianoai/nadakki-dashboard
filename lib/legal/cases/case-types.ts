/** Tipos alineados con el backend Legal Cases (Pydantic / OpenAPI). */

export type CaseState =
  | "EVALUACION_INICIAL"
  | "INGESTION"
  | "TRIAGE"
  | "STRATEGY"
  | "ACTIVE"
  | "HEARING"
  | "JUDGMENT"
  | "APPEAL"
  | "EXECUTION"
  | "CLOSED"
  | "ARCHIVED";

export type CaseType =
  | "defensa_civil_cobro_pesos"
  | "recurso_apelacion_civil"
  | "caso_penal_imputado"
  | "caso_penal_victima_querellante"
  | "caso_penal_evaluacion_general";

export type DocumentLifecycleStatus =
  | "draft"
  | "reviewed_by_agent"
  | "reviewed_by_attorney"
  | "finalized"
  | "submitted_to_court"
  | "received_by_court"
  | "resolved"
  | "rejected";

export type CasePriority = "low" | "normal" | "high" | "critical";

export type IssueSeverity = "low" | "medium" | "high" | "critical";

export type LockScope = "soft" | "hard";

export type DisasterLevel = "NORMAL" | "LLM_DEGRADED" | "RAG_DEGRADED" | "CRITICAL_FALLBACK";

export interface CaseActor {
  actor_id?: string;
  role: string;
  is_primary: boolean;
  actor_kind: "persona_fisica" | "persona_juridica" | "institucion";
  full_name: string;
  identification_type?: string;
  identification_number?: string;
  email?: string;
  phone?: string;
  conflict_check_done: boolean;
  conflict_detected: boolean;
}

export interface CaseDeadline {
  deadline_id: string;
  deadline_db_id: string;
  deadline_category: string;
  trigger_event: string;
  trigger_date: string;
  auto_calculated_deadline_date: string;
  has_human_override: boolean;
  effective_deadline_date: string;
  status: "active" | "completed" | "expired" | "cancelled" | "extended" | "overridden";
  legal_basis: string;
  is_peremptory: boolean;
  is_extendable: boolean;
}

export interface CaseStrategy {
  strategy_id: string;
  name: string;
  description: string;
  legal_basis: string;
  rationale: string;
  expected_strength: number;
  risks: string[];
  selected: boolean;
  status: "proposed" | "selected" | "executing" | "completed" | "abandoned";
}

export interface CaseDocument {
  document_id: string;
  document_type: string;
  title: string;
  direction: "incoming" | "outgoing" | "internal";
  lifecycle_status: DocumentLifecycleStatus;
  uploaded_at: string;
  extracted_data?: Record<string, unknown>;
  extracted_data_human_verified: boolean;
}

export interface RiskProfile {
  probability_of_loss: number;
  financial_exposure?: string;
  legal_complexity: "low" | "medium" | "high" | "critical";
  timeline_risk: "low" | "medium" | "high" | "critical";
  overall_risk_score: number;
  factors: Array<{ name: string; value: unknown; weight: number }>;
  last_calculated_at: string;
}

export interface CaseConfidence {
  overall_score: number;
  factors: Record<string, number>;
  last_calculated_at: string;
}

export interface CaseLock {
  lock_id: string;
  locked_by: string;
  locked_at: string;
  lock_expires_at: string;
  lock_reason: string;
  lock_scope: LockScope;
}

export interface CaseIssue {
  issue_id: string;
  issue_type: string;
  severity: IssueSeverity;
  title: string;
  description: string;
  detected_by: string;
  status: "open" | "investigating" | "resolved" | "wont_fix" | "duplicate";
}

export interface CaseSnapshot {
  snapshot_id: string;
  snapshot_reason?: string;
  created_at: string;
  snapshot_hash_sha256?: string;
  chained_hash?: string;
  state_at_snapshot?: CaseState;
}

export interface CaseTimelineEvent {
  event_id: string;
  event_type: string;
  event_category: string;
  occurred_at: string;
  payload: Record<string, unknown>;
  decision_trace?: Record<string, unknown> | null;
}

export interface LegalCase {
  case_id: string;
  case_number_internal: string;
  case_type: CaseType;
  legal_jurisdiction: string;
  state: CaseState;
  sub_state?: string;
  title: string;
  description?: string;
  practice_area_tags: string[];
  monto_demandado?: string;
  priority: CasePriority;
  client_roles: string[];
  related_case_ids: string[];
  has_expired_critical_deadline_at_ingestion: boolean;
  actors: CaseActor[];
  documents: CaseDocument[];
  deadlines: CaseDeadline[];
  strategies: CaseStrategy[];
  confidence?: CaseConfidence;
  risk_profile?: RiskProfile;
  active_lock?: CaseLock;
  open_issues_count: number;
  created_at: string;
  updated_at: string;
}

export interface AvailableAction {
  action_name: string;
  display_name: string;
  description: string;
  estimated_time_seconds: number;
  consumes_llm_tokens: boolean;
  requires_confirmation: boolean;
}

export interface AvailableActionsResponse {
  current_state: CaseState;
  current_sub_state?: string | null;
  current_user_role?: string;
  available_actions: AvailableAction[];
  transitions_available?: CaseState[];
}

export interface ListCasesResponse {
  cases: LegalCase[];
  total: number;
}

export interface CreateCasePayload {
  case_type: CaseType;
  title: string;
  description?: string;
  territorial_jurisdiction?: string;
  monto_demandado?: string;
  practice_area_tags?: string[];
  client_roles?: string[];
  priority?: CasePriority;
  initial_state?: "EVALUACION_INICIAL" | "INGESTION";
  initial_actors: Array<
    Omit<CaseActor, "conflict_check_done" | "conflict_detected"> & {
      conflict_check_done?: boolean;
      conflict_detected?: boolean;
    }
  >;
  related_case_ids?: string[];
}

/** Tipos de plantilla admitidos por el backend para generación con IA. */
export type LegalGeneratedDocumentType =
  | "demanda_civil_cobro_pesos"
  | "contestacion_demanda_civil"
  | "recurso_apelacion_civil"
  | "denuncia_penal"
  | "querella_penal"
  | "escrito_acusacion_querellante";

export const LEGAL_GENERATED_DOCUMENT_TYPES: LegalGeneratedDocumentType[] = [
  "demanda_civil_cobro_pesos",
  "contestacion_demanda_civil",
  "recurso_apelacion_civil",
  "denuncia_penal",
  "querella_penal",
  "escrito_acusacion_querellante",
];

export interface GenerateDocumentRequestBody {
  document_type: LegalGeneratedDocumentType;
  parameters: Record<string, unknown>;
}

/** Respuesta inmediata de POST .../documents/generate. */
export interface GeneratedDocumentDraftResponse {
  document_id: string;
  status: "draft";
  attorney_validated: boolean;
  content?: string;
}

/** Ítem en GET .../documents/generated. */
export interface GeneratedDocumentListItem {
  document_id: string;
  document_type?: string;
  generated_at?: string;
  attorney_validated?: boolean;
  status?: string;
  title?: string;
}

/** Detalle GET .../documents/generated/{doc_id}. */
export interface GeneratedDocumentDetail {
  document_id: string;
  document_type: string;
  content: string;
  attorney_validated: boolean;
  generated_at?: string;
  citations?: unknown;
}

export interface GeneratedDocumentsListResponse {
  documents: GeneratedDocumentListItem[];
  count: number;
}

/**
 * Projects Core DTOs (foundation stubs).
 *
 * Resync fields with `Nadakki_ProjectsCore_02_API_Contract_v1_1.yaml` once that
 * artifact is available in this workspace — names are aligned with `/api/v1/proyectos/*`.
 */

export const PROYECTO_STATES = [
  "INTAKE",
  "SCOPING",
  "PLANNING",
  "ACTIVE",
  "ON_HOLD",
  "REVIEW",
  "FINANCE_REVIEW",
  "LEGAL_REVIEW",
  "CERRADO",
] as const;

export type ProyectoState = (typeof PROYECTO_STATES)[number];

export const PROYECTO_STATE_LABELS_ES: Record<ProyectoState, string> = {
  INTAKE: "Intake",
  SCOPING: "Alcance",
  PLANNING: "Planificación",
  ACTIVE: "Ejecución",
  ON_HOLD: "En pausa",
  REVIEW: "Revisión",
  FINANCE_REVIEW: "Revisión finanzas",
  LEGAL_REVIEW: "Revisión legal",
  CERRADO: "Cerrado",
};

export function isProyectoState(value: string | null | undefined): value is ProyectoState {
  return Boolean(value && (PROYECTO_STATES as readonly string[]).includes(value));
}

/** PRD-aligned project categories (11) — reconcile names with OpenAPI when YAML lands. */
export const PROJECT_TYPE_CODES = [
  "TECH_PLATFORM",
  "PRODUCT_LAUNCH",
  "CAPITAL_EXPANSION",
  "OPERATIONAL_EFFICIENCY",
  "REGULATORY_COMPLIANCE",
  "CUSTOMER_EXPERIENCE",
  "DATA_AI_INITIATIVE",
  "SUSTAINABILITY_ESG",
  "MARKET_EXPANSION",
  "TRANSFORMATION_MNA",
  "INTERNAL_SUPPORT_INFRA",
] as const;

export type ProjectTypeCode = (typeof PROJECT_TYPE_CODES)[number];

export const PROJECT_TYPE_LABELS_ES: Record<ProjectTypeCode, string> = {
  TECH_PLATFORM: "Plataforma / tecnología",
  PRODUCT_LAUNCH: "Lanzamiento de producto",
  CAPITAL_EXPANSION: "Expansión de capital",
  OPERATIONAL_EFFICIENCY: "Eficiencia operativa",
  REGULATORY_COMPLIANCE: "Cumplimiento regulatorio",
  CUSTOMER_EXPERIENCE: "Experiencia de cliente",
  DATA_AI_INITIATIVE: "Datos e inteligencia",
  SUSTAINABILITY_ESG: "Sostenibilidad / ESG",
  MARKET_EXPANSION: "Expansión de mercado",
  TRANSFORMATION_MNA: "Transformación / M&A",
  INTERNAL_SUPPORT_INFRA: "Infraestructura / soporte interno",
};

export const METHODOLOGY_PACK_IDS = [
  "AGILE_SCRUM_STANDARD",
  "PHASE_GATE",
  "DESIGN_THINKING_SPRINT",
  "LEAN_PORTFOLIO",
  "HYBRID_GOVERNANCE",
] as const;

export type MethodologyPackId = (typeof METHODOLOGY_PACK_IDS)[number];

export const METHODOLOGY_LABELS_ES: Record<MethodologyPackId, string> = {
  AGILE_SCRUM_STANDARD: "Agile / Scrum (estándar suite)",
  PHASE_GATE: "Phase-gate / stage-gate",
  DESIGN_THINKING_SPRINT: "Design thinking / sprints exploratorios",
  LEAN_PORTFOLIO: "Lean portfolio / Kanban enterprise",
  HYBRID_GOVERNANCE: "Híbrido (PMO + equipos ágiles)",
};

export interface ProyectoDocumentStub {
  id?: string;
  label?: string;
  name?: string;
}

export interface Proyecto {
  id: string;
  name?: string | null;
  title?: string | null;
  state?: ProyectoState | string | null;
  description?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  project_type?: ProjectTypeCode | string | null;
  methodology_pack?: MethodologyPackId | string | null;
  viability_score?: number | null;
  risk_score?: number | null;
  preliminary_budget_minor_units?: number | null;
  budget_currency?: string | null;
  documents?: ProyectoDocumentStub[];
}

/** POST `/api/v1/proyectos` body (stub; align field casing with backend). */
export interface CreateProyectoPayload {
  name: string;
  project_type: ProjectTypeCode;
  methodology_pack: MethodologyPackId | string;
  preliminary_budget_minor_units?: number | null;
  budget_currency?: string | null;
  description?: string | null;
}

export interface SuperAgentMessagePart {
  type?: string;
  text?: string;
  [key: string]: unknown;
}

export interface SuperAgentEnvelopeMessage {
  role?: string;
  content?: unknown;
  parts?: SuperAgentMessagePart[];
}

/**
 * Loose envelope carrying Super-Agent turns (OpenAPI-aligned shape TBD).
 */
export interface EnvelopeSuperAgent {
  proyecto_id?: string;
  correlation_id?: string;
  messages?: SuperAgentEnvelopeMessage[];
  metadata?: Record<string, unknown>;
}

export interface AuditTrailEntry {
  id?: string;
  proyecto_id?: string;
  actor_id?: string | null;
  action?: string;
  created_at?: string | null;
  detail?: Record<string, unknown>;
}

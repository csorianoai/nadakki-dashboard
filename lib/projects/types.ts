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

export interface Proyecto {
  id: string;
  name?: string | null;
  title?: string | null;
  state?: ProyectoState | string | null;
  description?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
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

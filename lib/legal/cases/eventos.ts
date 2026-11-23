/**
 * Línea de tiempo legible para el abogado (QA 23-nov-2026: mostraba códigos
 * internos en inglés como «state.changed» o «document.uploaded» sin detalle).
 */
import type { CaseTimelineEvent } from "@/lib/legal/cases/case-types";

const NOMBRES: Record<string, string> = {
  "case.created": "Expediente creado",
  "case.archived": "Expediente archivado",
  "case.classification_corrected": "Clasificación o hechos corregidos",
  "case.linked": "Expediente relacionado",
  "case.representation_set": "Representación del despacho definida",
  "case.state_changed": "Cambio de estado",
  "state.changed": "Cambio de estado",
  "case.state_transition_blocked": "Cambio de estado bloqueado",
  "actor.added": "Parte agregada",
  "document.uploaded": "Documento subido",
  "document.generated": "Documento generado con IA",
  "document.queued_for_review": "Documento enviado a revisión de abogado",
  "document.extraction_verified": "Datos del documento verificados",
  "document.reviewed_by_agent": "Documento revisado por el sistema",
  "document.reviewed_by_attorney": "Documento revisado por abogado",
  "document.finalized": "Documento finalizado",
  "document.submitted_to_court": "Documento presentado al tribunal",
  "document.received_by_court": "Documento recibido por el tribunal",
  "document.resolved": "Documento resuelto",
  "document.rejected": "Documento rechazado",
  "document.draft": "Documento devuelto a borrador",
  "deadline.overridden": "Plazo corregido",
  "strategies.generated": "Estrategias generadas",
  "strategies.selected": "Estrategia seleccionada",
  "issue.reported": "Incidencia reportada",
  "issue.detected": "Incidencia detectada",
  "issue.resolved": "Incidencia resuelta",
  "risk.calculated": "Riesgo calculado",
  "attorney_review_assigned": "Revisión asignada a abogado",
  "attorney_review_claimed": "Revisión tomada por abogado",
  "attorney_review_approved": "Revisión aprobada por abogado",
  "attorney_review_rejected": "Revisión rechazada por abogado",
  "attorney_review_sla_breached": "Revisión de abogado fuera de plazo",
};

const ACCIONES: Record<string, string> = {
  compute_deadlines: "Plazos calculados",
  add_manual_deadline: "Plazo del tribunal registrado",
  complete_deadline: "Plazo marcado cumplido",
  generate_strategies: "Estrategias solicitadas",
  generate_document: "Documento solicitado",
};

export function nombreEvento(tipo: string): string {
  if (NOMBRES[tipo]) return NOMBRES[tipo];
  if (tipo.startsWith("action.")) return ACCIONES[tipo.slice(7)] ?? "Acción sobre el expediente";
  if (tipo.startsWith("agent_chain.")) return "Análisis automático completado";
  return tipo;
}

/** Detalle en una línea: estados, motivo o fecha, según lo que traiga el evento. */
export function detalleEvento(e: CaseTimelineEvent, estado: (s: string) => string): string | null {
  const p = (e.payload ?? {}) as Record<string, unknown>;
  const partes: string[] = [];
  const desde = p.from_state ?? p.from_status;
  const hacia = p.to_state ?? p.to_status ?? p.new_state;
  if (typeof hacia === "string" && e.event_type.includes("state")) {
    partes.push(typeof desde === "string" ? `${estado(desde)} → ${estado(hacia)}` : `→ ${estado(hacia)}`);
  }
  if (typeof p.new_date === "string") partes.push(`nueva fecha ${p.new_date}`);
  const motivo = p.reason ?? p.motivo;
  if (typeof motivo === "string" && motivo.trim() && motivo !== "manual_transition") partes.push(`Motivo: ${motivo}`);
  if (typeof p.title === "string") partes.push(p.title);
  return partes.length ? partes.join(" · ") : null;
}

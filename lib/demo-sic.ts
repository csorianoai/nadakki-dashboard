/**
 * Datos demo para modo presentación comercial SIC
 */

import type { Expediente, SesionComite, EventoAuditoria, Exportacion } from "@/lib/api/sic";
import type { EscenarioDemo } from "@/contexts/DemoContext";

const ANALISTAS = ["María García", "Carlos López", "Ana Martínez", "Pedro Sánchez", "Laura Fernández"];

function baseExpedientes(): Omit<Expediente, "expediente_id">[] {
  return [
    { referencia_cliente: "CLI-001", referencia_producto: "Crédito personal", estado_expediente: "EN_REVISION_ANALISTA", decision_actual: "APROBADO", confianza_decision: 0.85, asignado_a: ANALISTAS[0], fecha_creacion: "2025-02-25T10:00:00Z" },
    { referencia_cliente: "CLI-002", referencia_producto: "Hipotecario", estado_expediente: "EN_COMITE", decision_actual: "RECHAZADO", confianza_decision: 0.72, asignado_a: ANALISTAS[1], fecha_creacion: "2025-02-24T14:00:00Z" },
    { referencia_cliente: "CLI-003", referencia_producto: "Crédito PYME", estado_expediente: "APROBADO", decision_actual: "APROBADO", decision_final_humana: "APROBADO", confianza_decision: 0.91, asignado_a: ANALISTAS[2], fecha_creacion: "2025-02-23T09:00:00Z" },
    { referencia_cliente: "CLI-004", referencia_producto: "Tarjeta corporativa", estado_expediente: "EN_ANALISIS_IA", decision_actual: "Pendiente", confianza_decision: 0.65, asignado_a: ANALISTAS[0], fecha_creacion: "2025-02-26T11:00:00Z" },
    { referencia_cliente: "CLI-005", referencia_producto: "Línea sobregiro", estado_expediente: "RECHAZADO", decision_actual: "RECHAZADO", decision_final_humana: "RECHAZADO", override_usuario: ANALISTAS[1], override_justificacion: "Perfil de riesgo superior al umbral", confianza_decision: 0.58, asignado_a: ANALISTAS[1], fecha_creacion: "2025-02-22T16:00:00Z" },
    { referencia_cliente: "CLI-006", referencia_producto: "Crédito vehicular", estado_expediente: "EN_VALIDACION", decision_actual: "Pendiente", confianza_decision: 0, asignado_a: "—", fecha_creacion: "2025-02-26T08:00:00Z" },
    { referencia_cliente: "CLI-007", referencia_producto: "Microcrédito", estado_expediente: "EN_REVISION_ANALISTA", decision_actual: "APROBADO", confianza_decision: 0.88, asignado_a: ANALISTAS[3], fecha_creacion: "2025-02-25T12:00:00Z" },
    { referencia_cliente: "CLI-008", referencia_producto: "Crédito personal", estado_expediente: "REQUIERE_INFORMACION", decision_actual: "RECHAZADO", confianza_decision: 0.45, asignado_a: ANALISTAS[4], fecha_creacion: "2025-02-24T10:00:00Z" },
  ];
}

function applyEscenario<T extends { decision_actual?: string; estado_expediente?: string; confianza_decision?: number }>(
  items: T[],
  escenario: EscenarioDemo
): T[] {
  return items.map((item, i) => {
    const copy = { ...item };
    switch (escenario) {
      case "banco_conservador":
        if (copy.confianza_decision && copy.confianza_decision < 0.85) {
          copy.decision_actual = "RECHAZADO";
          copy.estado_expediente = "RECHAZADO";
        }
        break;
      case "banco_agresivo":
        if (copy.decision_actual === "RECHAZADO" && (copy as { override_usuario?: string }).override_usuario) break;
        copy.decision_actual = "APROBADO";
        copy.estado_expediente = copy.estado_expediente === "RECHAZADO" ? "APROBADO" : copy.estado_expediente;
        break;
      case "crisis_economica":
        if (i % 3 === 0) {
          copy.decision_actual = "RECHAZADO";
          copy.estado_expediente = "RECHAZADO";
        }
        break;
      case "alta_morosidad":
        if (i >= 4) {
          copy.decision_actual = "RECHAZADO";
          copy.estado_expediente = "RECHAZADO";
        }
        break;
      case "expansion_crediticia":
        if (copy.decision_actual === "RECHAZADO" && i < 5) {
          copy.decision_actual = "APROBADO";
          copy.estado_expediente = "APROBADO";
        }
        break;
    }
    return copy;
  });
}

export function getDemoExpedientes(escenario: EscenarioDemo): Expediente[] {
  const base = baseExpedientes().map((e, i) => ({
    ...e,
    expediente_id: `EXP-DEMO-${String(i + 1).padStart(4, "0")}`,
  })) as Expediente[];
  return applyEscenario(base, escenario) as Expediente[];
}

export function getDemoSesiones(_escenario: EscenarioDemo): SesionComite[] {
  return [
    { sesion_id: "SES-DEMO-001", fecha_sesion: "2025-02-26", estado_sesion: "abierta", expedientes_count: 3, creado_por: ANALISTAS[0], participantes: ANALISTAS.slice(0, 3) },
    { sesion_id: "SES-DEMO-002", fecha_sesion: "2025-02-25", estado_sesion: "cerrada", expedientes_count: 5, creado_por: ANALISTAS[1], participantes: ANALISTAS },
    { sesion_id: "SES-DEMO-003", fecha_sesion: "2025-02-24", estado_sesion: "cerrada", expedientes_count: 4, creado_por: ANALISTAS[2], participantes: ANALISTAS.slice(0, 4) },
  ];
}

export function getDemoEventosAuditoria(escenario: EscenarioDemo): EventoAuditoria[] {
  const expedientes = getDemoExpedientes(escenario);
  const eventos: EventoAuditoria[] = [];
  expedientes.slice(0, 5).forEach((e, i) => {
    eventos.push({
      evento_id: `EV-DEMO-${i + 1}`,
      expediente_id: e.expediente_id,
      tipo_evento: "DECISION",
      actor_id: e.asignado_a ?? "Sistema",
      actor_rol: "analista",
      detalle: `Decisión registrada: ${e.decision_actual}`,
      fecha_evento: e.fecha_creacion ?? "2025-02-26T10:00:00Z",
    });
  });
  return eventos;
}

export function getDemoExportaciones(escenario: EscenarioDemo): Exportacion[] {
  const exps = getDemoExpedientes(escenario).slice(0, 3);
  return exps.map((e, i) => ({
    exportacion_id: `EXPORT-DEMO-${i + 1}`,
    expediente_id: e.expediente_id,
    tipo_exportacion: i === 0 ? "pdf" : i === 1 ? "zip" : "regulatorio",
    estado_exportacion: "completado",
    fecha_generacion: "2025-02-26T09:00:00Z",
    generado_por: e.asignado_a ?? "Sistema",
  }));
}

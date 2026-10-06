import { STATE_LABEL } from "@/lib/credit-hub/bank/bankFormat";
import { resolveDisplayStatusLabel } from "@/lib/credit-hub/honesty/display-status";
import type { BankReviewPayload } from "@/lib/credit-hub/types/bank-views";

/** Textos llanos para el expediente: nada de enums, ids ni codigos a la vista. */

const EVENTO: Record<string, string> = {
  SUBMITTED: "Solicitud recibida",
  APPLICATION_CREATED: "Solicitud creada",
  APPLICATION_UPDATED: "Solicitud actualizada",
  ANALYZED: "Análisis del motor",
  CLAIMED: "Reclamada por un analista",
  BANK_REVIEW_STARTED: "Revisión iniciada",
  DECIDED: "Decisión registrada",
  BANK_DECISION_MADE: "Decisión registrada",
  DECISION_RENDERED: "Decisión notificada al dealer",
  APPLICATION_COUNTERED: "Contraoferta propuesta",
  COUNTER_OFFER_CREATED: "Contraoferta creada",
  COUNTER_OFFER_MADE: "Contraoferta enviada",
  COUNTER_OFFER_ACCEPTED: "Contraoferta aceptada",
  COUNTER_OFFER_REJECTED: "Contraoferta rechazada",
  STATE_TRANSITION: "Cambio de estado",
  COMPLIANCE_CHECKED: "Cumplimiento verificado",
  COMPLIANCE_APPROVED: "Cumplimiento aprobado",
  REQUESTED_DOCUMENT: "Documento solicitado",
  COMMENT_ADDED: "Nota interna",
  STIPULATION_ADDED: "Condición agregada",
  STIPULATION_VERIFIED: "Condición verificada",
  STIPULATION_REJECTED: "Condición rechazada",
  DOCUMENT_UPLOADED: "Documento cargado",
};

export function textoEvento(evento: string): string {
  return EVENTO[evento.trim().toUpperCase()] ?? "Evento del sistema";
}

const DECISION: Record<string, string> = { APROBADO: "Aprobada", RECHAZADO: "Rechazada", CONTRA_OFERTA: "Contraoferta", EN_REVISION: "En revisión" };
export function textoDecision(d: string | null | undefined): string | null {
  return d ? (DECISION[d.toUpperCase()] ?? null) : null;
}

const ID_TECNICO = /^[0-9a-f]{8}-[0-9a-f]{4}-|^[a-z_]+$/i;
/** Quien: un nombre se muestra; un id o un rol crudo, no. */
export function textoActor(by: string | null | undefined): string {
  const v = (by ?? "").trim();
  if (!v) return "Sistema";
  if (/^system|^sistema|engine|motor/i.test(v)) return "Sistema";
  return ID_TECNICO.test(v) ? "Usuario del banco" : v;
}

const DOC: Record<string, [string, "ok" | "parcial" | "pendiente"]> = {
  VALIDADO: ["Validado", "ok"],
  COMPLETED: ["Validado", "ok"],
  EN_REVISION: ["En revisión", "parcial"],
  PROCESSING: ["En revisión", "parcial"],
  PENDIENTE: ["Pendiente", "pendiente"],
  PENDING: ["Pendiente", "pendiente"],
  RECHAZADO: ["Rechazado", "pendiente"],
  REJECTED: ["Rechazado", "pendiente"],
};
export function estadoDocumento(status: string | null | undefined): [string, "ok" | "parcial" | "pendiente"] {
  return DOC[(status ?? "").trim().toUpperCase()] ?? ["Pendiente", "pendiente"];
}

const SEVERIDAD: Record<string, string> = { HIGH: "Alta", CRITICAL: "Crítica", MEDIUM: "Media", LOW: "Baja", ALTA: "Alta", MEDIA: "Media", BAJA: "Baja" };
export function textoSeveridad(s: string | null | undefined): string {
  return SEVERIDAD[(s ?? "").trim().toUpperCase()] ?? "Sin severidad";
}

export function datosCabecera(p: BankReviewPayload) {
  const a = p.applicant ?? {};
  const v = (p.vehicle ?? {}) as Record<string, unknown>;
  const f = p.financial ?? {};
  const m = p.analysis?.metrics;
  const texto = (x: unknown) => (typeof x === "string" && x.trim() ? x.trim() : null);
  const numero = (x: unknown) => (typeof x === "number" && Number.isFinite(x) ? x : null);
  const vehiculo =
    texto(v.label) ?? texto(v.vehicle_label) ?? ([v.make ?? v.marca, v.model ?? v.modelo, v.year ?? v.ano].filter(Boolean).join(" ") || null);
  return {
    nombre: texto(a.name) ?? texto(a.full_name) ?? "Solicitante sin nombre",
    ciudad: texto(a.city),
    vehiculo,
    dealer: texto(v.dealer) ?? texto(v.dealer_name) ?? texto(v.dealerName),
    monto: numero(f.requested_amount) ?? numero(p.analysis?.financed_amount),
    plazo: numero(f.term_months) ?? numero(m?.term_months),
    tasa: numero(f.requested_rate) ?? numero(m?.annual_rate),
    inicial: numero(f.down_payment) ?? numero(m?.down_payment),
  };
}

/** Estado a la vista: el display_status del servidor; si no llega, el de la cola. Nunca "Estado legado". */
export function textoEstado(displayStatus: string | null, estado: string | null | undefined): string {
  const r = resolveDisplayStatusLabel({ displayStatus, backendState: estado ?? null });
  if (r.source === "server") return r.label;
  return STATE_LABEL[estado ?? ""]?.[0] ?? "Sin estado";
}

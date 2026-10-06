import type { BankReviewPayload } from "@/lib/credit-hub/types/bank-views";
import type { BankApplicationClaim, BankDecisionTerms, BankDecisionType } from "@/lib/credit-hub/types/bankDecision";

/**
 * Logica de decision del expediente v2, igual a la del detalle actual
 * (BankDetailLayout): mismas condiciones para decidir, mismos terminos por
 * defecto y mismo criterio de prestamista. Solo cambia la presentacion.
 */
export type Accion = "approve" | "counter" | "reject";

export const ACCION: Record<Accion, { texto: string; decision: BankDecisionType }> = {
  approve: { texto: "Aprobar", decision: "APROBADO" },
  counter: { texto: "Contraoferta", decision: "CONTRA_OFERTA" },
  reject: { texto: "Rechazar", decision: "RECHAZADO" },
};

/** Motivos de rechazo: van en la justificacion (el backend fija los reason_codes por tipo). */
export const MOTIVOS_RECHAZO = [
  "DTI sobre el límite de política",
  "Ingresos no verificables",
  "Historial de buró desfavorable",
  "Documentación incompleta",
  "LTV sobre el máximo de política",
  "Inconsistencia de identidad o documentos",
  "Otro",
] as const;

export function terminosPorDefecto(p: BankReviewPayload): Partial<BankDecisionTerms> {
  const a = p.analysis;
  const m = a?.metrics;
  const f = p.financial ?? {};
  const monto = f.requested_amount ?? a?.financed_amount;
  const tasa = f.requested_rate ?? m?.annual_rate;
  const plazo = f.term_months ?? m?.term_months;
  const inicial = f.down_payment ?? m?.down_payment;
  return {
    ...(monto != null ? { approved_amount: Number(monto) } : {}),
    ...(tasa != null ? { interest_rate: Number(tasa) } : {}),
    ...(plazo != null ? { term_months: Number(plazo) } : {}),
    ...(inicial != null ? { down_payment_required: Number(inicial) } : {}),
    conditions: ["Validación documental final"],
  };
}

export function esDuenoDelClaim(claim: BankApplicationClaim | null | undefined, userId: string | null | undefined): boolean {
  return claim?.current_user_owns === true || Boolean(claim?.analyst_id && userId && claim.analyst_id === userId);
}

/** Por que no se puede decidir, o null si se puede. Misma condicion que el detalle actual. */
export function bloqueoDecision(o: { puedeRol: boolean; esDueno: boolean; yaDecidida: boolean }): string | null {
  if (o.yaDecidida) return "Esta solicitud ya tiene una decisión registrada.";
  if (!o.puedeRol) return "Tu rol no tiene permiso para registrar decisiones.";
  if (!o.esDueno) return "Esta solicitud no está asignada a ti. Pide que te la asignen para decidir.";
  return null;
}

/** Prestamistas: los de la comparacion de ofertas; si no hay, los claims por prestamista. */
export function prestamistas(codigosComparacion: Array<string | null | undefined>, claimsPorPrestamista: unknown): string[] {
  const codigos = codigosComparacion.map((c) => c?.trim()).filter((c): c is string => Boolean(c));
  if (codigos.length) return [...new Set(codigos)];
  return claimsPorPrestamista && typeof claimsPorPrestamista === "object" && !Array.isArray(claimsPorPrestamista) ? Object.keys(claimsPorPrestamista) : [];
}

export function justificacion(accion: Accion, texto: string, motivo: string): string {
  const nota = texto.trim();
  if (accion !== "reject") return nota;
  return nota ? `${motivo}. ${nota}` : motivo;
}

/** Valida el formulario; devuelve el error en llano o null. */
export function errorFormulario(accion: Accion, texto: string, motivo: string, prestamistaFalta: boolean): string | null {
  if (prestamistaFalta) return "Elige el prestamista con el que decides.";
  if (accion === "reject" && !motivo) return "Elige un motivo de la lista para poder rechazar.";
  if (accion === "reject" && motivo === "Otro" && !texto.trim()) return "El motivo “Otro” necesita una nota.";
  if (accion !== "reject" && !texto.trim()) return "Escribe el sustento de la decisión.";
  return null;
}

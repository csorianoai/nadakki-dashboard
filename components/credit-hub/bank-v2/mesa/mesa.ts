import type { BankQueueItem } from "@/lib/credit-hub/types/bankDecision";
import { PRIORITY_RANK } from "@/lib/credit-hub/bank/bankFormat";

/** Saludo segun la hora local: 05–11 dias, 12–18 tardes, resto noches. */
export function saludo(fecha: Date): string {
  const h = fecha.getHours();
  if (h >= 5 && h < 12) return "Buenos días";
  if (h >= 12 && h < 19) return "Buenas tardes";
  return "Buenas noches";
}

/** Primer nombre de la identidad de sesion; "Usuario" (placeholder) no se usa. */
export function primerNombre(nombre: string): string | null {
  const n = nombre.trim();
  if (!n || n === "Usuario") return null;
  return n.split(/\s+/)[0] ?? null;
}

export function estaPendiente(item: BankQueueItem): boolean {
  const estado = (item.state ?? "").toLowerCase();
  return !item.bank_decision && estado !== "decided" && estado !== "expired";
}

/**
 * Cola de decision: todo lo pendiente, del mas urgente al menos. La cola
 * actual no expone SLA, asi que la urgencia es la del backend: `priority`
 * (ALTA, MEDIA, BAJA) y, a igual prioridad, mayor score primero.
 */
export function colaPorUrgencia(items: BankQueueItem[]): BankQueueItem[] {
  return items
    .filter(estaPendiente)
    .sort((a, b) => (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9) || b.score - a.score);
}

export type Recomendacion = { accion: string; tono: "principal" | "secundaria" | "peligro" };

/**
 * Una sola accion recomendada, traducida de la banda del motor de scoring
 * (`approval_band`). Sin banda, la accion es abrir el expediente.
 */
export function recomendacion(banda: string | null): Recomendacion {
  switch ((banda ?? "").toUpperCase()) {
    case "PREAPROBABLE":
      return { accion: "Pre-aprobar", tono: "principal" };
    case "REQUIERE_AJUSTE":
      return { accion: "Aprobar con condiciones", tono: "secundaria" };
    case "REQUIERE_REVISION":
      return { accion: "Pedir información", tono: "secundaria" };
    case "NO_RECOMENDADO":
      return { accion: "Rechazar con motivo", tono: "peligro" };
    default:
      return { accion: "Revisar expediente", tono: "secundaria" };
  }
}

export const BANDA_TEXTO: Record<string, string> = {
  PREAPROBABLE: "Preaprobable",
  REQUIERE_AJUSTE: "Requiere ajuste",
  REQUIERE_REVISION: "Requiere revisión",
  NO_RECOMENDADO: "No recomendado",
};

export const RIESGO_TEXTO: Record<string, string> = {
  BAJO: "Bajo",
  MEDIO_BAJO: "Medio bajo",
  MEDIO: "Medio",
  ALTO: "Alto",
  MUY_ALTO: "Muy alto",
};

export const PRIORIDAD_TEXTO: Record<BankQueueItem["priority"], string> = { ALTA: "Alta", MEDIA: "Media", BAJA: "Baja" };

/** Iniciales para el avatar: nunca un id. */
export function iniciales(nombre: string | null): string {
  const partes = (nombre ?? "").replace(/[^\p{L}\s]/gu, " ").trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return "—";
  return ((partes[0]?.[0] ?? "") + (partes[1]?.[0] ?? "")).toUpperCase();
}

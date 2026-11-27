/**
 * Senal de avance del onboarding: una pantalla que guarda algo que cambia los primeros pasos llama
 * `avisarProgreso()` y la tarjeta del core se vuelve a pedir al instante (con antirrebote).
 *
 * El evento es el mismo de siempre ("nadakki:progreso"). `detail.core` es opcional: sin core (las pantallas de
 * Autos de hoy) refrescan todas las tarjetas montadas; con core, o con un motivo "core.algo" (p. ej.
 * "legal.expediente-creado"), solo la de ese core.
 */

export const EVENTO_PROGRESO = "nadakki:progreso";

/** Cores con tarjeta de primeros pasos en el panel. */
export const CORES_ONBOARDING = ["autos", "legal"] as const;
export type CoreOnboarding = (typeof CORES_ONBOARDING)[number];

export function avisarProgreso(motivo: string, core?: string): void {
  try {
    window.dispatchEvent(new CustomEvent(EVENTO_PROGRESO, { detail: core ? { motivo, core } : { motivo } }));
  } catch {
    /* sin window (SSR) o CustomEvent bloqueado: no hay nada que refrescar */
  }
}

/** Core al que va dirigida la senal, o null si vale para todos. */
export function coreDelEvento(detail: unknown): string | null {
  if (!detail || typeof detail !== "object") return null;
  const d = detail as { motivo?: unknown; core?: unknown };
  if (typeof d.core === "string" && d.core) return d.core;
  if (typeof d.motivo !== "string") return null;
  const prefijo = d.motivo.split(".")[0];
  return d.motivo.includes(".") && (CORES_ONBOARDING as readonly string[]).includes(prefijo) ? prefijo : null;
}

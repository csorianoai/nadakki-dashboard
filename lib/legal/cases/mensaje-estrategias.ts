/** Mensaje para el abogado: nunca el texto técnico del servidor. */
export function mensajeErrorEstrategias(e: unknown): string {
  const t = e instanceof Error ? e.message : "";
  if (/not available in state|\(409\)/i.test(t)) {
    return "En la etapa actual del expediente no se pueden generar estrategias. Revise los hechos del caso o cambie la etapa en el Resumen.";
  }
  if (/\b503\b/.test(t)) return "El modelo no está disponible en este momento. Intente de nuevo en unos minutos.";
  return "No se pudieron generar las estrategias. Intente de nuevo.";
}


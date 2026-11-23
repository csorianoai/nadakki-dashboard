"use client";

import type { LegalQuickCheckResponse } from "@/lib/legal-api";

/**
 * Dice en qué modo respondió el análisis. QA 23-nov: decía «Modo LLM (demo)» siempre,
 * aunque producción respondiera con el modelo en vivo.
 */
export function etiquetaModoLlm(mode: unknown): { titulo: string; detalle: string } {
  const m = typeof mode === "string" ? mode.trim().toUpperCase() : "";
  if (m === "MOCK" || m === "DEMO" || m === "DETERMINISTIC") {
    return { titulo: "Modo demostración:", detalle: "esta respuesta no la generó el modelo de lenguaje; no la uses para un caso real." };
  }
  if (m === "BLOCKED") {
    return { titulo: "Análisis bloqueado:", detalle: "el conocimiento legal de la jurisdicción no está verificado." };
  }
  if (m) {
    return { titulo: "Análisis con modelo de lenguaje:", detalle: "asistencia automatizada; no sustituye el dictamen del abogado." };
  }
  return { titulo: "Asistencia automatizada:", detalle: "no sustituye el dictamen del abogado." };
}

export function LlmModeNotice({ resultado }: { resultado?: LegalQuickCheckResponse | null }) {
  const { titulo, detalle } = etiquetaModoLlm(resultado?.metricas?.llm_mode);
  return (
    <div
      className="rounded-md border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-950"
      role="status"
      aria-live="polite"
    >
      <strong className="font-semibold">{titulo}</strong> {detalle}
    </div>
  );
}

"use client";

import type { LegalQuickCheckResponse } from "@/lib/legal-api";

/**
 * Guardrail 1 (Corrección 4): surface backend LLM mode when the API exposes it
 * (e.g. mock under demo policy). Static demo copy when absent.
 */
export function LlmModeNotice({ resultado }: { resultado?: LegalQuickCheckResponse | null }) {
  const mode = resultado?.metricas?.llm_mode;
  const modeStr = typeof mode === "string" ? mode : null;

  return (
    <div
      className="rounded-md border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-950"
      role="status"
      aria-live="polite"
    >
      <strong className="font-semibold">Modo LLM (demo):</strong>{" "}
      {modeStr ? (
        <span>
          el core reporta <code className="rounded bg-amber-100 px-1">{modeStr}</code> en esta ejecución.
        </span>
      ) : (
        <span>
          en entornos de demostración el backend puede forzar salida determinística o mock según políticas del Legal
          Core; no sustituye dictamen profesional.
        </span>
      )}
    </div>
  );
}

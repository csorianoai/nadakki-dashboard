"use client";

import type { StrictRejection } from "@/lib/legal/content-honesty";

export function LegalStrictRejectionPanel({ rejection }: { rejection: StrictRejection }) {
  if (!rejection.rejected) return null;

  return (
    <section
      className="rounded-lg border border-amber-300 bg-amber-50/90 p-4 text-sm text-amber-950"
      role="status"
      aria-live="polite"
    >
      <h3 className="font-semibold">Respuesta rechazada por el motor de validación</h3>
      <p className="mt-2">{rejection.reason}</p>
      <p className="mt-2 text-xs text-amber-800">
        Esto es un resultado válido del pipeline (strict mode), no un error de red. Ajuste la consulta o revise las
        fuentes requeridas.
      </p>
      {rejection.technicalDetail ? (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-medium text-amber-900">Detalle técnico</summary>
          <pre className="mt-2 max-h-40 overflow-auto rounded bg-amber-100/80 p-2 text-[11px] leading-snug">
            {rejection.technicalDetail}
          </pre>
        </details>
      ) : null}
    </section>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

/** Fase 2 post-sello: clave nueva para términos actualizados (solo flags de aceptación). */
const STORAGE_KEY_V2 = "legal_post_sello_accepted";
/** Compat tests / sesiones previas Worker C. */
const STORAGE_KEY_LEGACY = "legal_demo_accepted";

export function DemoAcceptanceModal() {
  const router = useRouter();
  const [accepted, setAccepted] = useState(true);

  useEffect(() => {
    setAccepted(window.localStorage.getItem(STORAGE_KEY_V2) === "true");
  }, []);

  if (accepted) return null;

  const handleAccept = () => {
    window.localStorage.setItem(STORAGE_KEY_V2, "true");
    window.localStorage.setItem(STORAGE_KEY_LEGACY, "true");
    setAccepted(true);
  };

  const handleCancel = () => {
    router.push("/legal");
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-demo-modal-title"
    >
      <div className="bg-white rounded-xl max-w-lg p-6 space-y-4 shadow-xl border border-emerald-200">
        <h2 id="legal-demo-modal-title" className="text-xl font-medium text-emerald-950">
          Piloto controlado — Legal Core RD (Fase 2)
        </h2>
        <p className="text-slate-700 leading-relaxed">
          El knowledge pack para República Dominicana está <strong>verificado</strong> (sello profesional). El
          asistente utiliza <strong>LLM real</strong> bajo políticas del Legal Core; las salidas son asistencia
          institucional y <strong>no sustituyen</strong> consulta ni representación legal.
        </p>
        <p className="text-slate-700 leading-relaxed">
          Al continuar, acepta que las exportaciones y copias incluyen el watermark{" "}
          <strong className="whitespace-nowrap">PILOTO CONTROLADO</strong> y que no basará actos jurídicos definitivos
          solo en esta herramienta.
        </p>
        <p className="text-amber-800 text-sm border border-amber-200 bg-amber-50 rounded-lg p-3">
          <strong>Capa 2 — citas:</strong> las referencias marcadas con ⚠️ siguen{" "}
          <strong>sin verificación contra fuente oficial</strong>; valídelas con su abogado o fuente primaria.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="px-5 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800"
          >
            Acepto, continuar
          </button>
        </div>
      </div>
    </div>
  );
}

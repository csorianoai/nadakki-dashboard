"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "legal_demo_accepted";

export function DemoAcceptanceModal() {
  const router = useRouter();
  const [accepted, setAccepted] = useState(true);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    setAccepted(stored === "true");
  }, []);

  if (accepted) return null;

  const handleAccept = () => {
    window.localStorage.setItem(STORAGE_KEY, "true");
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
      <div className="bg-white rounded-xl max-w-lg p-6 space-y-4 shadow-xl">
        <h2 id="legal-demo-modal-title" className="text-xl font-medium">
          Aviso importante antes de continuar
        </h2>
        <p className="text-slate-700 leading-relaxed">
          Esta plataforma está en fase de desarrollo. Las respuestas son generadas automáticamente por sistemas de
          inteligencia artificial y heurísticas legales, y <strong>NO sustituyen consulta legal profesional</strong>.
        </p>
        <p className="text-slate-700 leading-relaxed">
          Al continuar, usted acepta que NO usará estas respuestas como base de decisiones legales reales. Cada respuesta
          lleva watermark &quot;DEMO&quot; hasta que un abogado autorizado RD valide formalmente el sistema.
        </p>
        <p className="text-amber-700 text-sm">
          Las citas legales que aparezcan marcadas con ⚠️ no han sido verificadas contra fuente oficial.
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
            className="px-5 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
          >
            Acepto, continuar
          </button>
        </div>
      </div>
    </div>
  );
}

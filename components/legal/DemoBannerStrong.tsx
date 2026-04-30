"use client";

import { AlertTriangle, ShieldCheck } from "lucide-react";
import { useKnowledgePackInfo } from "@/hooks/useLegal";

export function DemoBannerStrong() {
  const { info, loading } = useKnowledgePackInfo("do");
  const verified = info?.verification_status === "verified";

  if (loading) {
    return (
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-500 max-w-6xl mx-auto">
        Cargando estado del knowledge pack…
      </div>
    );
  }

  if (verified) {
    return (
      <div className="border-b border-green-200/80 bg-green-50 px-4 py-2 text-sm text-green-900 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 shrink-0 text-green-700" aria-hidden="true" />
          <p className="leading-snug">
            <span className="font-medium">Sistema en piloto controlado</span>
            {" — "}
            Conocimiento legal validado por abogado RD autorizado. Las respuestas asisten pero no sustituyen asesoría
            legal profesional.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-amber-950">
      <div className="flex items-start gap-3 max-w-6xl mx-auto">
        <AlertTriangle className="h-6 w-6 shrink-0 text-amber-600 mt-0.5" aria-hidden="true" />
        <div className="text-sm">
          <strong className="block mb-1">Validación pendiente — entorno restrictivo</strong>
          <p>
            El knowledge pack legal no está verificado como &quot;firmado&quot; en este tenant. Las respuestas no
            constituyen consejo legal.
            <strong> No usar para decisiones jurídicas definitivas.</strong>
          </p>
        </div>
      </div>
    </div>
  );
}

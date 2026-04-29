"use client";

import { useKnowledgePackInfo } from "@/hooks/useLegal";

export function DemoBannerStrong() {
  const { info } = useKnowledgePackInfo("do");
  const verified = info?.verification_status === "verified";

  if (verified) {
    return (
      <div className="bg-green-100 border-y border-green-400 px-4 py-2 text-green-900 text-sm">
        <div className="max-w-6xl mx-auto flex items-center gap-2">
          <span aria-hidden="true">✓</span>
          <span>
            <strong>Sistema en piloto controlado.</strong> Knowledge pack verificado por
            {info?.verified_by ? ` ${info.verified_by}` : " abogado autorizado"}
            {info?.verified_at ? ` el ${new Date(info.verified_at).toLocaleDateString()}` : ""}.
            Revisión profesional sigue siendo obligatoria.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-100 border-y border-amber-400 px-4 py-3 text-amber-900">
      <div className="flex items-start gap-3 max-w-6xl mx-auto">
        <span className="text-2xl" aria-hidden="true">
          ⚠️
        </span>
        <div className="text-sm">
          <strong className="block mb-1">Demo técnica — sistema en validación</strong>
          <p>
            Las respuestas son determinísticas y no constituyen consejo legal. El sistema está pendiente de
            validación por abogado autorizado RD.
            <strong> NO usar para tomar decisiones reales.</strong>
          </p>
        </div>
      </div>
    </div>
  );
}

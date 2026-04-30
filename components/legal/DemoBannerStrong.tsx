"use client";

import { useKnowledgePackInfo } from "@/hooks/useLegal";

/** Abogado que selló el pack RD (Fase 2); el API puede sobreescribir con `verified_by`. */
const RD_PACK_VERIFIED_BY_FALLBACK = "Ramon Almonte Soriano";

export function DemoBannerStrong() {
  const { info } = useKnowledgePackInfo("do");
  const verified = info?.verification_status === "verified";
  const verifiedBy = info?.verified_by?.trim() || RD_PACK_VERIFIED_BY_FALLBACK;

  if (verified) {
    return (
      <div className="bg-emerald-100 border-y border-emerald-500 px-4 py-3 text-emerald-950 text-sm">
        <div className="max-w-6xl mx-auto flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
          <span className="shrink-0 text-lg" aria-hidden="true">
            ✓
          </span>
          <div>
            <strong className="block sm:inline">Piloto controlado — Fase 2 (post sello).</strong>{" "}
            <span>
              Knowledge pack <abbr title="República Dominicana">RD</abbr> verificado por {verifiedBy}
              {info?.verified_at ? ` (${new Date(info.verified_at).toLocaleDateString("es-DO")})` : ""}. El Legal Core
              opera con <strong>LLM real</strong> bajo políticas del tenant; cada entrega sigue requiriendo revisión
              por abogado autorizado antes de actos jurídicos.
            </span>
          </div>
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
            Las respuestas no constituyen consejo legal. El knowledge pack RD puede estar pendiente de sello
            notarial / registro interno.
            <strong> NO usar para tomar decisiones reales.</strong>
          </p>
        </div>
      </div>
    </div>
  );
}

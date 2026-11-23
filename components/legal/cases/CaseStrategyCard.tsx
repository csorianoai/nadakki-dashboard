"use client";

import type { CaseStrategy } from "@/lib/legal/cases/case-types";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";

/** Fortaleza: porcentaje si el backend lo da; si no, la confianza del modelo (alta/media/baja). */
export function fortalezaDeEstrategia(s: CaseStrategy, etiquetas: Record<string, string>): string | null {
  if (typeof s.expected_strength === "number" && Number.isFinite(s.expected_strength)) {
    return `${Math.round(s.expected_strength * 100)}%`;
  }
  return s.confianza ? etiquetas[s.confianza] ?? s.confianza : null;
}

export function CaseStrategyCard({ strategy: s }: { strategy: CaseStrategy }) {
  const m = useLegalCasesMessages();
  const nombre = s.name || s.title;
  const descripcion = s.description || s.objetivo;
  const fortaleza = fortalezaDeEstrategia(s, {
    alta: m.strategy.confidence_high,
    media: m.strategy.confidence_medium,
    baja: m.strategy.confidence_low,
  });
  return (
    <div className="flex-1 text-sm">
      {nombre ? <p className="font-semibold text-forgeGray-900">{nombre}</p> : null}
      {descripcion && descripcion !== nombre ? <p className="text-forgeGray-600">{descripcion}</p> : null}
      {s.pasos?.length ? (
        <ol className="mt-1 list-inside list-decimal space-y-0.5 text-xs text-forgeGray-700">
          {s.pasos.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ol>
      ) : null}
      {fortaleza ? (
        <p className="mt-1 text-xs text-forgeGray-500">
          {s.confianza && typeof s.expected_strength !== "number" ? m.strategy.confidence : m.strategy.expected_strength}:{" "}
          {fortaleza}
        </p>
      ) : null}
      {s.risks?.length ? (
        <p className="mt-1 text-xs text-forgeWarning-800">
          {m.strategy.risks}: {s.risks.join(" · ")}
        </p>
      ) : null}
    </div>
  );
}

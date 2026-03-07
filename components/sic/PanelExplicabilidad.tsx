"use client";

import type { Explicabilidad } from "@/lib/api/sic";

interface PanelExplicabilidadProps {
  data: Explicabilidad | null;
}

export function PanelExplicabilidad({ data }: PanelExplicabilidadProps) {
  if (!data) {
    return <p className="text-slate-500 text-xs">Sin datos de explicabilidad.</p>;
  }

  const favor = data.factores_a_favor ?? [];
  const contra = data.factores_en_contra ?? [];
  const reglas = data.reglas_aplicadas ?? [];
  const narrativa = data.narrativa_ejecutiva ?? data.resumen_ejecutivo ?? "";

  return (
    <div className="space-y-3 text-xs">
      {narrativa && (
        <div>
          <span className="text-slate-500 block mb-1">Narrativa ejecutiva</span>
          <p className="text-slate-200 leading-relaxed">{narrativa}</p>
        </div>
      )}
      {favor.length > 0 && (
        <div>
          <span className="text-emerald-400 font-medium block mb-1">Factores a favor</span>
          <ul className="list-disc list-inside text-slate-300 space-y-0.5">
            {favor.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
      )}
      {contra.length > 0 && (
        <div>
          <span className="text-amber-400 font-medium block mb-1">Factores en contra</span>
          <ul className="list-disc list-inside text-slate-300 space-y-0.5">
            {contra.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      )}
      {reglas.length > 0 && (
        <div>
          <span className="text-slate-500 block mb-1">Reglas aplicadas</span>
          <ul className="list-disc list-inside text-slate-400 space-y-0.5">
            {reglas.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}
      {!narrativa && favor.length === 0 && contra.length === 0 && reglas.length === 0 && (
        <p className="text-slate-500">Sin datos de explicabilidad.</p>
      )}
    </div>
  );
}

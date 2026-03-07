"use client";

import { useState } from "react";
import type { Explicabilidad, FactorConEvidencia } from "@/lib/api/sic";
import { PanelEvidencia } from "./PanelEvidencia";
import type { Evidencia } from "@/lib/api/sic";

interface PanelExplicabilidadProps {
  data: Explicabilidad | null;
  expedienteId?: string;
  tenantId?: string;
  onVerEvidencia?: (evidenciaId: string) => Promise<Evidencia | null>;
}

function textoFactor(f: FactorConEvidencia): string {
  return typeof f === "string" ? f : f.texto;
}

function evidenciaIdFactor(f: FactorConEvidencia): string | undefined {
  return typeof f === "string" ? undefined : f.evidencia_id;
}

export function PanelExplicabilidad({
  data,
  expedienteId,
  tenantId,
  onVerEvidencia,
}: PanelExplicabilidadProps) {
  const [evidenciaActual, setEvidenciaActual] = useState<Evidencia | null>(null);
  const [cargandoEvidencia, setCargandoEvidencia] = useState(false);

  const handleClickFactor = async (f: FactorConEvidencia) => {
    const id = evidenciaIdFactor(f);
    if (!id || !onVerEvidencia) return;
    setCargandoEvidencia(true);
    setEvidenciaActual(null);
    try {
      const ev = await onVerEvidencia(id);
      setEvidenciaActual(ev ?? {
        evidencia_id: id,
        detalle: "Evidencia no disponible. El backend puede exponer /api/v1/sic/evidencias/{id}.",
      });
    } catch {
      setEvidenciaActual({
        evidencia_id: id,
        detalle: "Error al cargar evidencia.",
      });
    } finally {
      setCargandoEvidencia(false);
    }
  };

  if (!data) {
    return <p className="text-slate-500 text-xs">Sin datos de explicabilidad.</p>;
  }

  const favor = data.factores_a_favor ?? [];
  const contra = data.factores_en_contra ?? [];
  const reglas = data.reglas_aplicadas ?? [];
  const narrativa = data.narrativa_ejecutiva ?? (data as { resumen_ejecutivo?: string }).resumen_ejecutivo ?? "";

  const ItemFactor = ({ f }: { f: FactorConEvidencia }) => {
    const id = evidenciaIdFactor(f);
    const tieneEvidencia = Boolean(id && onVerEvidencia);
    return (
      <li>
        {tieneEvidencia ? (
          <button
            type="button"
            onClick={() => handleClickFactor(f)}
            disabled={cargandoEvidencia}
            className="text-left hover:text-cyan-400 hover:underline disabled:opacity-50 cursor-pointer"
          >
            {textoFactor(f)}
            <span className="ml-1 text-cyan-500/80 text-[10px]">[evidencia]</span>
          </button>
        ) : (
          <span>{textoFactor(f)}</span>
        )}
      </li>
    );
  };

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
              <ItemFactor key={i} f={f} />
            ))}
          </ul>
        </div>
      )}
      {contra.length > 0 && (
        <div>
          <span className="text-amber-400 font-medium block mb-1">Factores en contra</span>
          <ul className="list-disc list-inside text-slate-300 space-y-0.5">
            {contra.map((f, i) => (
              <ItemFactor key={i} f={f} />
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
      {evidenciaActual && (
        <div className="border-t border-slate-700/80 pt-3 mt-3">
          <PanelEvidencia
            evidencia={evidenciaActual}
            expedienteId={expedienteId}
            onCerrar={() => setEvidenciaActual(null)}
          />
        </div>
      )}
      {!narrativa && favor.length === 0 && contra.length === 0 && reglas.length === 0 && (
        <p className="text-slate-500">Sin datos de explicabilidad.</p>
      )}
    </div>
  );
}

"use client";

import type { Evidencia } from "@/lib/api/sic";

interface PanelEvidenciaProps {
  evidencia: Evidencia | null;
  expedienteId?: string;
  onCerrar?: () => void;
}

export function PanelEvidencia({ evidencia, expedienteId, onCerrar }: PanelEvidenciaProps) {
  if (!evidencia) return null;

  const tipo = evidencia.tipo_evidencia ?? "Documento";
  const ref = evidencia.referencia ?? evidencia.evidencia_id ?? "—";
  const origen = evidencia.origen ?? "—";
  const detalle = evidencia.detalle ?? "—";

  return (
    <div className="rounded-lg border border-slate-600 bg-slate-800/80 p-4 text-xs">
      <div className="flex items-start justify-between gap-2 mb-3">
        <h4 className="text-slate-300 font-600 uppercase tracking-wide">Evidencia</h4>
        {onCerrar && (
          <button
            onClick={onCerrar}
            className="text-slate-500 hover:text-slate-300"
            type="button"
          >
            Cerrar
          </button>
        )}
      </div>
      <dl className="space-y-2 text-slate-300">
        <div>
          <dt className="text-slate-500">Tipo</dt>
          <dd className="font-medium">{tipo}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Referencia</dt>
          <dd className="font-mono">{ref}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Origen</dt>
          <dd>{origen}</dd>
        </div>
        {expedienteId && (
          <div>
            <dt className="text-slate-500">Expediente</dt>
            <dd className="font-mono">{expedienteId}</dd>
          </div>
        )}
        <div>
          <dt className="text-slate-500">Detalle</dt>
          <dd className="text-slate-400 leading-relaxed">{detalle}</dd>
        </div>
        {evidencia.url && (
          <div>
            <dt className="text-slate-500">Enlace</dt>
            <dd>
              <a
                href={evidencia.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:underline"
              >
                Abrir recurso
              </a>
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}

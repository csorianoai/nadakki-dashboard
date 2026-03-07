"use client";

import type { Expediente, Explicabilidad } from "@/lib/api/sic";

interface MemoEjecutivoProps {
  expediente: Expediente;
  explicabilidad?: Explicabilidad | null;
  onExportar?: () => void;
}

export function MemoEjecutivo({ expediente, explicabilidad, onExportar }: MemoEjecutivoProps) {
  const e = expediente;
  const fav = explicabilidad?.factores_a_favor ?? [];
  const contra = explicabilidad?.factores_en_contra ?? [];
  const reglas = explicabilidad?.reglas_aplicadas ?? [];
  const narrativa = explicabilidad?.narrativa_ejecutiva ?? "";

  const texto = (x: string | { texto?: string }) => (typeof x === "string" ? x : x.texto ?? "");

  return (
    <div className="rounded-lg border border-slate-600 bg-slate-900/80 p-5 text-sm">
      <div className="border-b border-slate-600 pb-3 mb-4 flex items-center justify-between">
        <h3 className="text-slate-200 font-700 uppercase tracking-wide">Memo Ejecutivo</h3>
        {onExportar && (
          <button
            onClick={onExportar}
            className="rounded px-3 py-1 bg-slate-700 text-slate-200 text-xs hover:bg-slate-600"
          >
            Exportar
          </button>
        )}
      </div>

      <section className="space-y-4">
        <div>
          <dt className="text-slate-500 text-xs uppercase tracking-wide mb-1">Resumen ejecutivo</dt>
          <dd className="text-slate-200 leading-relaxed">
            {narrativa || `Expediente ${e.expediente_id} — Cliente: ${e.referencia_cliente ?? "—"}, Producto: ${e.referencia_producto ?? "—"}.`}
          </dd>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-slate-500 text-xs uppercase mb-1">Decisión IA</dt>
            <dd className="text-slate-200 font-medium">{e.decision_actual ?? "—"} ({e.confianza_decision ?? "—"}%)</dd>
          </div>
          <div>
            <dt className="text-slate-500 text-xs uppercase mb-1">Decisión final</dt>
            <dd className={e.decision_final_humana ? "text-emerald-300 font-medium" : "text-slate-400"}>
              {e.decision_final_humana ?? "Pendiente"}
            </dd>
          </div>
        </div>

        {e.decision_final_humana && e.override_usuario && (
          <div>
            <dt className="text-slate-500 text-xs uppercase mb-1">Override</dt>
            <dd className="text-slate-200">
              Por {e.override_usuario}. {e.override_justificacion && (
                <span className="text-slate-400 italic">— {e.override_justificacion}</span>
              )}
            </dd>
          </div>
        )}

        {fav.length > 0 && (
          <div>
            <dt className="text-emerald-400 text-xs uppercase mb-1">Factores a favor</dt>
            <dd>
              <ul className="list-disc list-inside text-slate-300 space-y-0.5">
                {fav.map((f, i) => (
                  <li key={i}>{texto(f)}</li>
                ))}
              </ul>
            </dd>
          </div>
        )}

        {contra.length > 0 && (
          <div>
            <dt className="text-amber-400 text-xs uppercase mb-1">Riesgos / Factores en contra</dt>
            <dd>
              <ul className="list-disc list-inside text-slate-300 space-y-0.5">
                {contra.map((c, i) => (
                  <li key={i}>{texto(c)}</li>
                ))}
              </ul>
            </dd>
          </div>
        )}

        {reglas.length > 0 && (
          <div>
            <dt className="text-slate-500 text-xs uppercase mb-1">Compliance / Reglas aplicadas</dt>
            <dd>
              <ul className="list-disc list-inside text-slate-400 space-y-0.5">
                {reglas.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </dd>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-600">
          <div>
            <dt className="text-slate-500 text-xs uppercase mb-1">Estado documental</dt>
            <dd className="text-slate-300">{e.estado_expediente ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500 text-xs uppercase mb-1">Trazabilidad</dt>
            <dd className="text-slate-300">Versión {e.version_activa ?? "—"} · Asignado: {e.asignado_a ?? "—"}</dd>
          </div>
        </div>
      </section>
    </div>
  );
}

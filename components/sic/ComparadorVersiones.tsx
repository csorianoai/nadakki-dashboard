"use client";

import { useState } from "react";
import type { VersionAnalisis, ComparacionVersiones } from "@/lib/api/sic";

interface ComparadorVersionesProps {
  versiones: VersionAnalisis[];
  onComparar: (va: string, vb: string) => Promise<ComparacionVersiones | null>;
}

export function ComparadorVersiones({ versiones, onComparar }: ComparadorVersionesProps) {
  const [versionA, setVersionA] = useState("");
  const [versionB, setVersionB] = useState("");
  const [resultado, setResultado] = useState<ComparacionVersiones | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleComparar = async () => {
    if (!versionA || !versionB) return;
    setLoading(true);
    setError(null);
    setResultado(null);
    try {
      const r = await onComparar(versionA, versionB);
      setResultado(r ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  if (versiones.length < 2) {
    return (
      <p className="text-slate-500 text-xs">Se requieren al menos 2 versiones para comparar.</p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-end">
        <div>
          <label className="text-slate-500 text-xs block mb-1">Versión A</label>
          <select
            value={versionA}
            onChange={(e) => setVersionA(e.target.value)}
            className="bg-slate-800/80 border border-slate-600 rounded px-2 py-1 text-slate-200 text-xs"
          >
            <option value="">Seleccionar</option>
            {versiones.map((v) => (
              <option key={v.version_id} value={v.version_id}>
                v{v.numero_version ?? v.version_id}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-slate-500 text-xs block mb-1">Versión B</label>
          <select
            value={versionB}
            onChange={(e) => setVersionB(e.target.value)}
            className="bg-slate-800/80 border border-slate-600 rounded px-2 py-1 text-slate-200 text-xs"
          >
            <option value="">Seleccionar</option>
            {versiones.map((v) => (
              <option key={v.version_id} value={v.version_id}>
                v{v.numero_version ?? v.version_id}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleComparar}
          disabled={loading || !versionA || !versionB}
          className="rounded px-3 py-1 bg-cyan-600 text-white text-xs font-medium hover:bg-cyan-500 disabled:opacity-50"
        >
          {loading ? "Comparando…" : "Comparar"}
        </button>
      </div>
      {error && (
        <div className="rounded border border-red-500/50 bg-red-500/10 px-2 py-1 text-xs text-red-300">
          {error}
        </div>
      )}
      {resultado && (
        <div className="rounded border border-slate-600 bg-slate-800/50 p-3 text-xs space-y-2">
          {resultado.diferencias?.decision && (
            <div>
              <span className="text-slate-500">Decisión:</span>{" "}
              <span className="text-amber-300">{resultado.diferencias.decision.antes}</span>
              {" → "}
              <span className="text-emerald-300">{resultado.diferencias.decision.despues}</span>
            </div>
          )}
          {resultado.diferencias?.confianza && (
            <div>
              <span className="text-slate-500">Confianza:</span>{" "}
              {resultado.diferencias.confianza.antes} → {resultado.diferencias.confianza.despues}
            </div>
          )}
          {resultado.diferencias?.reglas && resultado.diferencias.reglas.length > 0 && (
            <div>
              <span className="text-slate-500">Reglas diferentes:</span>
              <ul className="list-disc list-inside text-slate-300 mt-1">
                {resultado.diferencias.reglas.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useLegalQuickCheck } from "@/hooks/useLegal";
import { DecisionBadge } from "@/components/legal/DecisionBadge";
import { CitationBadge } from "@/components/legal/CitationBadge";
import { AuditTrailCard } from "@/components/legal/AuditTrailCard";
import { LlmModeNotice } from "@/components/legal/LlmModeNotice";

export default function ContractsPage() {
  const [texto, setTexto] = useState("");
  const { loading, result, submit, tenantMissing } = useLegalQuickCheck();

  const handleAnalyze = async () => {
    if (!texto.trim()) return;
    await submit({
      tipo_solicitud: "contrato_simple",
      texto,
      jurisdiccion: "DO",
      etiquetas_area_practica: ["civil", "bancario"],
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-medium">Análisis de contrato</h2>
      {tenantMissing && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
          Selecciona un tenant en el selector global para enviar análisis al Legal Core.
        </p>
      )}
      <textarea
        className="w-full min-h-[200px] rounded-lg border border-slate-300 p-3 font-mono text-sm"
        placeholder="Pega aquí el texto del contrato..."
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
      />
      <button
        type="button"
        onClick={() => void handleAnalyze()}
        disabled={loading || !texto.trim() || tenantMissing}
        className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Analizando..." : "Analizar contrato"}
      </button>

      {result && (
        <div className="space-y-3 mt-6 bg-white rounded-lg border p-5">
          <LlmModeNotice resultado={result} />
          <DecisionBadge decision={result.decision} />
          <p className="text-slate-700">{result.decision.explicacion}</p>

          {(result.codigos_razon?.length ?? 0) > 0 && (
            <details className="text-sm">
              <summary className="cursor-pointer text-slate-700 font-medium">
                {result.codigos_razon!.length} códigos de razón
              </summary>
              <ul className="mt-2 space-y-1 ml-4">
                {result.codigos_razon!.map((c, i) => (
                  <li key={i}>
                    <code className="text-xs">{c.codigo}</code> — {c.descripcion}
                  </li>
                ))}
              </ul>
            </details>
          )}

          {(result.citas?.length ?? 0) > 0 && (
            <div>
              <strong className="text-sm">Citas:</strong>
              <div className="flex flex-wrap gap-1 mt-1">
                {result.citas!.map((c, i) => (
                  <CitationBadge
                    key={i}
                    citation={c}
                    verified={result.citas_verificadas?.includes(c) ?? false}
                  />
                ))}
              </div>
            </div>
          )}

          <AuditTrailCard trazabilidad={result.trazabilidad_auditoria} />
        </div>
      )}
    </div>
  );
}

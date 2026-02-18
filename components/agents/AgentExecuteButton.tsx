"use client";

import { useState } from "react";
import { useExecuteAgent } from "@/app/hooks/useExecuteAgent";

interface AgentExecuteButtonProps {
  agentId: string;
  agentName?: string;
  tenantId?: string;
  isLive?: boolean;
}

export default function AgentExecuteButton({
  agentId,
  agentName,
  tenantId = "default",
  isLive = false,
}: AgentExecuteButtonProps) {
  const { execute, result, loading, error, clear } = useExecuteAgent();
  const [showResult, setShowResult] = useState(false);

  const handleExecute = async () => {
    const dryRun = !isLive;
    await execute(agentId, { test: true }, dryRun, tenantId);
    setShowResult(true);
  };

  return (
    <div className="space-y-3">
      {/* Botón Ejecutar */}
      <button
        onClick={handleExecute}
        disabled={loading}
        className={`
          px-4 py-2 rounded-lg font-medium text-sm transition-all
          ${loading
            ? "bg-gray-400 cursor-not-allowed text-gray-200"
            : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md"
          }
        `}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Ejecutando...
          </span>
        ) : (
          `▶ Ejecutar ${agentName || agentId}`
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          <strong>Error:</strong> {error}
          <button onClick={clear} className="ml-2 text-red-500 underline text-xs">Cerrar</button>
        </div>
      )}

      {/* Resultado */}
      {showResult && result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-green-800">
              ✅ {result.success ? "Éxito" : "Fallo"} — {result.dry_run ? "DRY RUN" : "LIVE"}
            </span>
            <button
              onClick={() => setShowResult(false)}
              className="text-gray-400 hover:text-gray-600 text-xs"
            >
              ✕
            </button>
          </div>

          {/* Decision */}
          {result.result?.decision && (
            <div className="mb-2 p-2 bg-white rounded border">
              <div className="font-medium text-gray-700">
                Acción: {result.result.decision.action}
              </div>
              <div className="text-gray-500">
                Confianza: {Math.round((result.result.decision.confidence || 0) * 100)}%
              </div>
              <div className="text-gray-500">
                {result.result.decision.explanation}
              </div>
            </div>
          )}

          {/* Compliance */}
          {result.result?.compliance_status && (
            <div className="text-xs text-gray-500">
              Compliance: {result.result.compliance_status} |
              Business Impact: {result.result.business_impact_score || "N/A"}
            </div>
          )}

          {/* Raw JSON toggle */}
          <details className="mt-2">
            <summary className="cursor-pointer text-xs text-blue-600">Ver JSON completo</summary>
            <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-auto max-h-60">
              {JSON.stringify(result.result, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}


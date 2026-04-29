"use client";

import { useAuditLog } from "@/hooks/useLegal";

export default function AuditPage() {
  const { entries, loading, error, refetch } = useAuditLog(100);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-medium">Audit log</h2>
        <button
          type="button"
          onClick={() => void refetch()}
          className="text-sm bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-lg"
        >
          Refrescar
        </button>
      </div>

      {loading && <p className="text-slate-500">Cargando...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}

      <div className="bg-white rounded-lg shadow border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-left p-3">Timestamp</th>
              <th className="text-left p-3">Execution ID</th>
              <th className="text-left p-3">Tipo</th>
              <th className="text-left p-3">Cadena</th>
              <th className="text-left p-3">Decisión</th>
              <th className="text-left p-3">Cumplimiento</th>
              <th className="text-left p-3">Latencia</th>
              <th className="text-left p-3">LLM</th>
              <th className="text-left p-3">Pack hash</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, rowIdx) => (
              <tr key={e.execution_id || `row-${rowIdx}`} className="border-b hover:bg-slate-50">
                <td className="p-3 text-xs">{new Date(e.timestamp).toLocaleString()}</td>
                <td className="p-3 font-mono text-xs">
                  {e.execution_id.length > 8 ? `${e.execution_id.slice(0, 8)}…` : e.execution_id}
                </td>
                <td className="p-3">{e.tipo_solicitud}</td>
                <td className="p-3 text-xs font-mono">{(e.cadena_agentes ?? []).join(" → ")}</td>
                <td className="p-3">{e.decision_accion}</td>
                <td className="p-3">
                  <span
                    className={
                      e.estado_cumplimiento === "PASS"
                        ? "text-green-700"
                        : e.estado_cumplimiento === "FAIL"
                          ? "text-red-700"
                          : "text-amber-700"
                    }
                  >
                    {e.estado_cumplimiento}
                  </span>
                </td>
                <td className="p-3 text-xs">{e.latencia_ms}ms</td>
                <td className="p-3 text-xs">{e.llm_mode ?? "—"}</td>
                <td className="p-3 font-mono text-xs">
                  {e.knowledge_pack_hash && e.knowledge_pack_hash.length > 12
                    ? `${e.knowledge_pack_hash.slice(0, 12)}…`
                    : (e.knowledge_pack_hash ?? "—")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 && !loading && (
          <p className="text-center text-slate-500 py-8">Sin ejecuciones registradas todavía.</p>
        )}
      </div>
    </div>
  );
}

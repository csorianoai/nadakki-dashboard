"use client";

import { useState, useEffect, useCallback } from "react";
import { useTenant } from "@/contexts/TenantContext";

/** Same-origin; proxied via next.config rewrites */
const API_URL = "";

interface AuditLog {
  timestamp: string;
  agent_id: string;
  mode: string;
  status: string;
  latency_ms?: number;
  trace_id?: string;
}

export default function AuditPage() {
  const { tenantId } = useTenant();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [available, setAvailable] = useState<boolean | null>(null);

  const fetchLogs = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    setAvailable(null);
    try {
      const url = `${API_URL}/api/v1/audit/logs?tenant_id=${encodeURIComponent(tenantId)}&limit=50`;
      const res = await fetch(url, { headers: { "X-Tenant-ID": tenantId } });
      if (!res.ok) {
        setAvailable(false);
        setLogs([]);
        setError("Backend no disponible o endpoint de audit en progreso.");
        return;
      }
      const data = await res.json();
      const items = Array.isArray(data) ? data : data?.logs ?? data?.data ?? [];
      setLogs(items);
      setAvailable(true);
    } catch {
      setAvailable(false);
      setLogs([]);
      setError("Backend no disponible o endpoint de audit en progreso.");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    if (tenantId) fetchLogs();
  }, [tenantId, fetchLogs]);

  return (
    <div className="p-6 max-w-6xl mx-auto text-slate-100">
      <h1 className="text-2xl font-bold text-slate-100 mb-6">Audit Logs</h1>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <span className="text-sm text-slate-400">Tenant: {tenantId ?? "--"}</span>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Cargando..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-400/30 rounded-lg text-amber-200 text-sm">
          {error}
        </div>
      )}

      {available === true && (
        <div className="border border-white/10 rounded-lg overflow-hidden bg-white/5">
          <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-900/90 sticky top-0 backdrop-blur">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-slate-300">timestamp</th>
                  <th className="px-4 py-2 text-left font-semibold text-slate-300">agent_id</th>
                  <th className="px-4 py-2 text-left font-semibold text-slate-300">mode</th>
                  <th className="px-4 py-2 text-left font-semibold text-slate-300">status</th>
                  <th className="px-4 py-2 text-left font-semibold text-slate-300">latency_ms</th>
                  <th className="px-4 py-2 text-left font-semibold text-slate-300">trace_id</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      No logs yet for this tenant.
                    </td>
                  </tr>
                ) : (
                  logs.map((log, i) => (
                    <tr key={`${log.trace_id ?? "trace"}-${i}`} className="border-t border-white/5 hover:bg-white/5">
                      <td className="px-4 py-2 text-slate-300">{log.timestamp ?? "-"}</td>
                      <td className="px-4 py-2 font-mono text-xs text-slate-200">{log.agent_id ?? "-"}</td>
                      <td className="px-4 py-2 text-slate-300">{log.mode ?? "-"}</td>
                      <td className="px-4 py-2 text-slate-300">{log.status ?? "-"}</td>
                      <td className="px-4 py-2 text-slate-300">{log.latency_ms ?? "-"}</td>
                      <td className="px-4 py-2 font-mono text-xs text-slate-400">{log.trace_id ?? "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

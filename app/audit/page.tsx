"use client";

import { useState, useEffect, useCallback } from "react";

const TENANT_STORAGE_KEY = "nadakki_tenant_id_id";
const DEFAULT_TENANT = "default";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://nadakki-ai-suite.onrender.com";

interface AuditLog {
  timestamp: string;
  agent_id: string;
  mode: string;
  status: string;
  latency_ms?: number;
  trace_id?: string;
}

function getStoredTenant(): string {
  if (typeof window === "undefined") return DEFAULT_TENANT;
  return localStorage.getItem(TENANT_STORAGE_KEY) || DEFAULT_TENANT;
}

const TENANT_OPTIONS = ["default", "tenant_credicefi", "tenant_demo"];

export default function AuditPage() {
  const [tenantId, setTenantId] = useState<string>(DEFAULT_TENANT);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [available, setAvailable] = useState<boolean | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAvailable(null);
    try {
      const url = `${API_URL}/api/v1/audit/logs?tenant_id=${encodeURIComponent(tenantId)}&limit=50`;
      const res = await fetch(url);
      if (!res.ok) {
        setAvailable(false);
        setLogs([]);
        setError("Audit aÃºn no disponible (backend en progreso)");
        return;
      }
      const data = await res.json();
      const items = Array.isArray(data) ? data : data?.logs ?? data?.data ?? [];
      setLogs(items);
      setAvailable(true);
    } catch {
      setAvailable(false);
      setLogs([]);
      setError("Audit aÃºn no disponible (backend en progreso)");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    setTenantId(getStoredTenant());
  }, []);

  useEffect(() => {
    if (tenantId) fetchLogs();
  }, [tenantId, fetchLogs]);

  const handleTenantChange = (t: string) => {
    setTenantId(t);
    if (typeof window !== "undefined") {
      localStorage.setItem(TENANT_STORAGE_KEY, t);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Audit Logs</h1>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <label htmlFor="audit-tenant" className="text-sm text-gray-600">Tenant:</label>
          <select
            id="audit-tenant"
            value={tenantId}
            onChange={(e) => handleTenantChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {TENANT_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Cargando..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
          {error}
        </div>
      )}

      {available === true && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">timestamp</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">agent_id</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">mode</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">status</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">latency_ms</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">trace_id</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No hay registros
                    </td>
                  </tr>
                ) : (
                  logs.map((log, i) => (
                    <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-600">{log.timestamp ?? "â€”"}</td>
                      <td className="px-4 py-2 font-mono text-xs">{log.agent_id ?? "â€”"}</td>
                      <td className="px-4 py-2">{log.mode ?? "â€”"}</td>
                      <td className="px-4 py-2">{log.status ?? "â€”"}</td>
                      <td className="px-4 py-2">{log.latency_ms ?? "â€”"}</td>
                      <td className="px-4 py-2 font-mono text-xs">{log.trace_id ?? "â€”"}</td>
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

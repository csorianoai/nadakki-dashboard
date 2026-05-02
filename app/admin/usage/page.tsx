"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "@/lib/motion-stub";
import { BarChart3, List, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import { useTenant } from "@/contexts/TenantContext";

/** Same-origin; proxied via next.config rewrites */
const API_URL = "";

interface UsageData {
  executions_this_month?: number;
  limit?: number;
  executions?: { date: string; agent: string; result: string }[];
}

function hasUsagePayload(u: UsageData): boolean {
  if (u.executions_this_month != null && Number.isFinite(Number(u.executions_this_month))) return true;
  if (u.limit != null && Number.isFinite(Number(u.limit))) return true;
  if (Array.isArray(u.executions) && u.executions.length > 0) return true;
  return false;
}

export default function AdminUsagePage() {
  const { tenantId } = useTenant();
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = useCallback((quiet = false) => {
    if (!tenantId) return;
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError(null);
    fetch(`${API_URL}/api/v1/tenants/${tenantId}/usage`)
      .then(async (r) => {
        if (!r.ok) {
          setData(null);
          setError(`La API devolvió HTTP ${r.status}. No hay datos estimados ni de demostración.`);
          return;
        }
        const d = await r.json().catch(() => null);
        const usage = (d?.data ?? d) as UsageData | null;
        if (!usage || !hasUsagePayload(usage)) {
          setData(null);
          setError(null);
          return;
        }
        setData(usage);
      })
      .catch(() => {
        setData(null);
        setError("No se pudo cargar el uso (red o error de cliente).");
      })
      .finally(() => {
        if (quiet) setRefreshing(false);
        else setLoading(false);
      });
  }, [tenantId]);

  useEffect(() => {
    if (tenantId) fetchUsage(false);
    else {
      setLoading(false);
      setRefreshing(false);
      setData(null);
      setError(null);
    }
  }, [tenantId, fetchUsage]);

  const used = data?.executions_this_month;
  const limit = data?.limit;
  const executions = data?.executions ?? [];
  const hasLimit = limit != null && Number.isFinite(Number(limit)) && Number(limit) > 0;
  const usedNum = used != null && Number.isFinite(Number(used)) ? Number(used) : null;
  const pct =
    hasLimit && usedNum != null ? Math.min(100, (usedNum / Number(limit)) * 100) : null;

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/admin">
        <span className="text-sm text-gray-400">Tenant: {tenantId || "—"}</span>
        <button
          type="button"
          onClick={() => fetchUsage(true)}
          disabled={loading || refreshing || !tenantId}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 disabled:opacity-50"
        >
          {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Actualizar
        </button>
      </NavigationBar>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-white">Usage</h1>
        <p className="text-gray-400 mt-1">Ejecuciones y límites del tenant</p>
      </motion.div>

      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
        </div>
      )}

      {!loading && !tenantId && (
        <GlassCard className="p-8 border-white/10">
          <p className="text-gray-400 m-0">Selecciona un tenant para cargar uso real desde el API.</p>
        </GlassCard>
      )}

      {!loading && tenantId && error && (
        <GlassCard className="p-6 border-red-500/30 bg-red-500/5">
          <p className="text-red-200 text-sm m-0 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            {error}
          </p>
        </GlassCard>
      )}

      {!loading && tenantId && !error && !data && (
        <GlassCard className="p-8 border-white/10">
          <p className="text-gray-400 m-0">
            Sin datos de uso para este tenant: respuesta vacía, sin métricas reconocibles o cuerpo no parseable. No se
            rellenan filas de ejemplo.
          </p>
        </GlassCard>
      )}

      {!loading && tenantId && data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-6 h-6 text-cyan-400" />
              <h2 className="text-xl font-bold text-white">Ejecuciones este mes</h2>
            </div>
            <div className="space-y-3">
              {pct != null ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">
                      {usedNum?.toLocaleString() ?? "—"} / {Number(limit).toLocaleString()}
                    </span>
                    <span className="text-gray-300">{pct.toFixed(1)}%</span>
                  </div>
                  <div className="h-6 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8 }}
                      className={`h-full rounded-full ${pct > 90 ? "bg-amber-500" : pct > 70 ? "bg-yellow-500" : "bg-cyan-500"}`}
                    />
                  </div>
                </>
              ) : (
                <p className="text-gray-400 text-sm">
                  {usedNum != null ? (
                    <>Ejecuciones este mes: {usedNum.toLocaleString()}</>
                  ) : (
                    <>El backend no envió un límite o volumen comparable para dibujar la barra.</>
                  )}
                  {limit != null && !hasLimit && (
                    <span className="block mt-1">Límite informado: {String(limit)}</span>
                  )}
                </p>
              )}
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <List className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-bold text-white">Últimas ejecuciones</h2>
            </div>
            {executions.length === 0 ? (
              <p className="text-gray-400 text-sm">No hay filas de ejecución en la respuesta.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-white/10">
                      <th className="py-2 pr-4">Fecha</th>
                      <th className="py-2 pr-4">Agente</th>
                      <th className="py-2">Resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {executions.slice(0, 10).map((e, i) => (
                      <tr key={i} className="border-b border-white/5">
                        <td className="py-2 pr-4 text-gray-400">{e.date}</td>
                        <td className="py-2 pr-4 text-gray-300 font-mono text-xs truncate max-w-[200px]">{e.agent}</td>
                        <td className="py-2">
                          <span className={`px-2 py-0.5 rounded ${e.result === "success" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                            {e.result}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Loader2, RefreshCw, Play, AlertTriangle } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import { useTenant } from "@/contexts/TenantContext";
import {
  getAuthMetaStatus,
  getAuthGoogleStatus,
  testAgentDryRun,
  type AgentTestResult,
} from "@/lib/api/qa";

export default function AdminQAPage() {
  const { tenantId } = useTenant();
  const [metaStatus, setMetaStatus] = useState<Record<string, unknown> | null>(null);
  const [googleStatus, setGoogleStatus] = useState<Record<string, unknown> | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [agentResult, setAgentResult] = useState<AgentTestResult | null>(null);
  const [agentError, setAgentError] = useState<string | null>(null);
  const [agentLoading, setAgentLoading] = useState(false);

  const fetchAuthStatus = async () => {
    if (!tenantId) {
      setAuthLoading(false);
      return;
    }
    setAuthLoading(true);
    try {
      const [meta, google] = await Promise.all([
        getAuthMetaStatus(tenantId),
        getAuthGoogleStatus(tenantId),
      ]);
      setMetaStatus(meta);
      setGoogleStatus(google);
    } catch {
      setMetaStatus(null);
      setGoogleStatus(null);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthStatus();
  }, [tenantId]);

  const runAgentTest = async () => {
    if (!tenantId) return;
    setAgentLoading(true);
    setAgentError(null);
    setAgentResult(null);
    try {
      const res = await testAgentDryRun("socialpostgeneratoria", tenantId);
      setAgentResult(res);
    } catch (e) {
      setAgentError(e instanceof Error ? e.message : String(e));
    } finally {
      setAgentLoading(false);
    }
  };

  const metaConnected = metaStatus && (metaStatus.connected === true || (metaStatus.meta as Record<string, unknown>)?.connected === true);
  const googleConnected = googleStatus && ((googleStatus as Record<string, unknown>).connected === true || ((googleStatus as Record<string, unknown>).google as Record<string, unknown>)?.connected === true);

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/admin">
        <span className="text-sm text-gray-400">Tenant: {tenantId ?? "—"}</span>
        <button
          onClick={fetchAuthStatus}
          disabled={authLoading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300"
        >
          {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Actualizar
        </button>
      </NavigationBar>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-white">QA Piloto</h1>
        <p className="text-gray-400 mt-1">Verificación operativa del tenant</p>
      </motion.div>

      {!tenantId ? (
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 text-amber-400">
            <AlertTriangle className="w-6 h-6 flex-shrink-0" />
            <p>Selecciona un tenant para continuar.</p>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-6">
          <GlassCard className="p-6">
            <h2 className="text-lg font-bold text-white mb-4">Tenant activo</h2>
            <p className="text-gray-300 font-mono">{tenantId}</p>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-lg font-bold text-white mb-4">Estado de conexiones</h2>
            {authLoading ? (
              <p className="text-gray-400 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Cargando…
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                  <span className="text-gray-300">Meta</span>
                  {metaConnected ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-500" />
                  )}
                  <span className="text-sm text-gray-400">
                    {metaConnected ? "Conectado" : "No conectado"}
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                  <span className="text-gray-300">Google</span>
                  {googleConnected ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-500" />
                  )}
                  <span className="text-sm text-gray-400">
                    {googleConnected ? "Conectado" : "No conectado"}
                  </span>
                </div>
              </div>
            )}
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-lg font-bold text-white mb-4">Test Agent (dry_run=true)</h2>
            <p className="text-gray-400 text-sm mb-4">
              socialpostgeneratoria → resuelto vía /api/v1/agents/ids
            </p>
            <button
              onClick={runAgentTest}
              disabled={agentLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {agentLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Play className="w-5 h-5" />
              )}
              Ejecutar Test
            </button>

            {agentError && (
              <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {agentError}
              </div>
            )}

            {agentResult && (
              <div className="mt-4 p-4 rounded-lg bg-white/5 border border-white/10 text-sm space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">success:</span>
                  <span className={agentResult.success ? "text-green-400" : "text-red-400"}>
                    {String(agentResult.success)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">dry_run:</span>
                  <span className="text-gray-300">{String(agentResult.dry_run ?? true)}</span>
                </div>
                {agentResult.result?.decision && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">action:</span>
                      <span className="text-gray-300">
                        {String(agentResult.result.decision.action ?? "—")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">confidence:</span>
                      <span className="text-gray-300">
                        {agentResult.result.decision.confidence != null
                          ? `${Math.round(agentResult.result.decision.confidence * 100)}%`
                          : "—"}
                      </span>
                    </div>
                    {agentResult.result.decision.explanation && (
                      <div>
                        <span className="text-gray-400 block mb-1">explanation:</span>
                        <p className="text-gray-300">{agentResult.result.decision.explanation}</p>
                      </div>
                    )}
                  </>
                )}
                {agentResult.result?.business_impact_score != null && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">business_impact_score:</span>
                    <span className="text-gray-300">{String(agentResult.result.business_impact_score)}</span>
                  </div>
                )}
                <details className="mt-2">
                  <summary className="cursor-pointer text-gray-400 hover:text-gray-300">
                    Ver JSON completo
                  </summary>
                  <pre className="mt-2 p-3 rounded bg-black/30 text-xs overflow-auto max-h-60">
                    {JSON.stringify(agentResult, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  );
}

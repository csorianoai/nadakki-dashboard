"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTenant } from "@/contexts/TenantContext";
import { fetchWithTimeout } from "@/lib/api/base";
import { CORES_CONFIG, CORE_CATEGORIES, getAllCores, getTotalAgents } from "@/config/cores";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Activity, Zap, Bot, Layers, CheckCircle2, AlertCircle, Loader2,
  RefreshCw, ChevronRight, TrendingUp, Clock, BarChart3,
} from "lucide-react";

interface SystemHealth {
  status: string;
  version: string;
  agents_loaded: number;
  cores_active: number;
}

interface RecentActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  status: "success" | "warning" | "error" | "info";
}

export default function DashboardPage() {
  const { tenantId, settings } = useTenant();
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const allCores = getAllCores();

  const fetchHealth = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchWithTimeout<SystemHealth>("/health", { tenantId, timeout: 15000 });
      setHealth(data);
      setError(null);
      setLastUpdate(new Date());
    } catch {
      setError("No se pudo conectar al backend");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const activities: RecentActivity[] = [
    { id: "1", type: "workflow", title: "Workflow Marketing ejecutado", description: "Customer Acquisition Intelligence completado", timestamp: "Hace 2 min", status: "success" },
    { id: "2", type: "decision", title: "Decisión de crédito procesada", description: "Score: 78/100 - Aprobado", timestamp: "Hace 5 min", status: "success" },
    { id: "3", type: "agent", title: "Agente PredictiveLeadIA activo", description: "Procesando 1,234 leads", timestamp: "Hace 12 min", status: "info" },
    { id: "4", type: "alert", title: "Límite de API cercano", description: "85% del límite utilizado", timestamp: "Hace 1 hora", status: "warning" },
  ];

  const statusIcons: Record<string, JSX.Element> = {
    success: <CheckCircle2 className="h-4 w-4 text-green-400" />,
    warning: <AlertCircle className="h-4 w-4 text-yellow-400" />,
    error: <AlertCircle className="h-4 w-4 text-red-400" />,
    info: <Activity className="h-4 w-4 text-blue-400" />,
  };

  return (
    <DashboardLayout>
      <div className="p-6 bg-gray-950 min-h-screen">
        {/* Header con Status */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Dashboard Principal</h1>
            <p className="text-gray-400 text-sm">Bienvenido a NADAKKI AI Suite - {settings.name}</p>
          </div>
          <div className="flex items-center gap-4">
            {/* System Status */}
            {health?.status === "healthy" ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-sm text-green-400">Sistema Operativo</span>
              </div>
            ) : error ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <span className="text-sm text-red-400">Sin conexión</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30">
                <Loader2 className="h-4 w-4 animate-spin text-yellow-400" />
                <span className="text-sm text-yellow-400">Conectando...</span>
              </div>
            )}
            
            {/* Refresh */}
            <button
              onClick={fetchHealth}
              disabled={loading}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <RefreshCw className={`h-5 w-5 text-gray-400 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-400">{error}</p>
              <p className="text-xs text-red-400/70">El backend puede estar iniciándose (30-60s en Render free tier)</p>
            </div>
            <button onClick={fetchHealth} className="px-3 py-1 rounded-lg bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30">
              Reintentar
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="rounded-2xl border border-green-500/30 bg-gradient-to-br from-green-500/10 to-green-600/5 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Estado Backend</p>
                <p className="text-2xl font-bold text-white">{health?.status === "healthy" ? "Operativo" : loading ? "..." : "Offline"}</p>
                {health && <p className="text-xs text-gray-500 mt-1">v{health.version}</p>}
              </div>
              <div className="p-2 rounded-lg bg-green-500/20">
                <Activity className="h-5 w-5 text-green-400" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/5 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Agentes Cargados</p>
                <p className="text-2xl font-bold text-white">{health?.agents_loaded || getTotalAgents()}</p>
                <p className="text-xs text-gray-500 mt-1">Disponibles</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Bot className="h-5 w-5 text-purple-400" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Cores Activos</p>
                <p className="text-2xl font-bold text-white">{health?.cores_active || 20}</p>
                <p className="text-xs text-gray-500 mt-1">de {allCores.length} totales</p>
              </div>
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <Layers className="h-5 w-5 text-cyan-400" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Workflows Activos</p>
                <p className="text-2xl font-bold text-white">10</p>
                <p className="text-xs text-gray-500 mt-1">En ejecución</p>
              </div>
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <Zap className="h-5 w-5 text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-400" />
                Acciones Rápidas
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Link href="/workflows" className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 transition-all group">
                  <div className="p-3 rounded-lg bg-purple-500/20">
                    <Layers className="h-6 w-6 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white">Ejecutar Workflow</p>
                    <p className="text-sm text-gray-400">10 workflows disponibles</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                </Link>

                <Link href="/marketing" className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-orange-500/30 transition-all group">
                  <div className="p-3 rounded-lg bg-orange-500/20">
                    <Bot className="h-6 w-6 text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white">Marketing Agents</p>
                    <p className="text-sm text-gray-400">35 agentes activos</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-500 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
                </Link>

                <Link href="/analytics" className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/30 transition-all group">
                  <div className="p-3 rounded-lg bg-blue-500/20">
                    <BarChart3 className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white">Analytics</p>
                    <p className="text-sm text-gray-400">Métricas en tiempo real</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                </Link>

                <Link href="/decision" className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-pink-500/30 transition-all group">
                  <div className="p-3 rounded-lg bg-pink-500/20">
                    <Activity className="h-6 w-6 text-pink-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white">Motor de Decisiones</p>
                    <p className="text-sm text-gray-400">Scoring en tiempo real</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-500 group-hover:text-pink-400 group-hover:translate-x-1 transition-all" />
                </Link>
              </div>
            </div>

            {/* System Info */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Información del Sistema</h2>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between p-3 rounded-lg bg-white/5">
                  <span className="text-gray-400">Tenant</span>
                  <span className="text-white font-medium">{settings.name}</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-white/5">
                  <span className="text-gray-400">Plan</span>
                  <span className="text-purple-400 font-medium">{settings.plan.toUpperCase()}</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-white/5">
                  <span className="text-gray-400">Backend Version</span>
                  <span className="text-white font-mono">{health?.version || "..."}</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-white/5">
                  <span className="text-gray-400">Última actualización</span>
                  <span className="text-white">{lastUpdate?.toLocaleTimeString() || "..."}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-400" />
                Actividad Reciente
              </h2>
              <Link href="/admin/logs" className="text-xs text-purple-400 hover:text-purple-300">Ver todo</Link>
            </div>
            <div className="space-y-3">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="mt-0.5">{statusIcons[activity.status]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{activity.title}</p>
                    <p className="text-xs text-gray-400 truncate">{activity.description}</p>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap">{activity.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
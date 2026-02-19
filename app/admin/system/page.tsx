"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Server, Database, RefreshCw, Loader2, CheckCircle, XCircle } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://nadakki-ai-suite.onrender.com";

interface SystemInfo {
  version?: string;
  uptime?: number;
  db_provider?: string;
  total_tenants?: number;
  total_agents?: number;
}

interface DbStatus {
  connected?: boolean;
  provider?: string;
  tenant_count?: number;
  tables?: string[];
}

export default function AdminSystemPage() {
  const [info, setInfo] = useState<SystemInfo | null>(null);
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch(`${API_URL}/api/v1/system/info`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => setInfo(d?.data || d))
        .catch(() => setInfo(null)),
      fetch(`${API_URL}/api/v1/db/status`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => setDbStatus(d))
        .catch(() => setDbStatus(null)),
    ]).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="ndk-page ndk-fade-in">
        <NavigationBar backHref="/admin" />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/admin">
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300"
        >
          <RefreshCw className="w-4 h-4" /> Actualizar
        </button>
      </NavigationBar>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-white">System Info</h1>
        <p className="text-gray-400 mt-1">Estado del sistema y base de datos</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Server className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-bold text-white">Sistema</h2>
          </div>
          {info ? (
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-gray-400">Version</span>
                <span className="text-white font-mono">{info.version ?? "—"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-gray-400">Uptime</span>
                <span className="text-white">{info.uptime != null ? `${Math.floor(info.uptime / 3600)}h` : "—"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-gray-400">DB Provider</span>
                <span className="text-white">{info.db_provider ?? "—"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-gray-400">Total Tenants</span>
                <span className="text-white">{info.total_tenants ?? "—"}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400">Total Agents</span>
                <span className="text-white">{info.total_agents ?? "—"}</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No disponible</p>
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Base de datos</h2>
          </div>
          {dbStatus ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {dbStatus.connected ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
                <span className="text-white">{dbStatus.connected ? "Conectado" : "Desconectado"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-gray-400">Provider</span>
                <span className="text-white">{dbStatus.provider ?? "—"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-gray-400">Tenant count</span>
                <span className="text-white">{dbStatus.tenant_count ?? "—"}</span>
              </div>
              {dbStatus.tables && dbStatus.tables.length > 0 && (
                <div>
                  <span className="text-gray-400 text-sm block mb-2">Tablas</span>
                  <div className="flex flex-wrap gap-2">
                    {dbStatus.tables.map((t) => (
                      <span key={t} className="px-2 py-1 rounded bg-white/5 text-gray-300 text-sm font-mono">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">DB status no disponible</p>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

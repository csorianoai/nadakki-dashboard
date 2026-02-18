"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Database, RefreshCw, Loader2, CheckCircle, XCircle } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://nadakki-ai-suite.onrender.com";

interface DbStatus {
  connected?: boolean;
  provider?: string;
  tenant_count?: number;
  tables?: string[];
}

export default function AdminDbPage() {
  const [status, setStatus] = useState<DbStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchStatus = () => {
    setLoading(true);
    setError(false);
    fetch(`${API_URL}/api/v1/db/status`)
      .then((r) => {
        if (!r.ok) throw new Error("Not available");
        return r.json();
      })
      .then((d) => setStatus(d))
      .catch(() => {
        setStatus(null);
        setError(true);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/admin">
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Actualizar
        </button>
      </NavigationBar>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-white">Database Status</h1>
        <p className="text-gray-400 mt-1">Estado de conexión y esquema</p>
      </motion.div>

      {loading ? (
        <GlassCard className="p-12 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-gray-400">Cargando estado...</p>
        </GlassCard>
      ) : error || !status ? (
        <GlassCard className="p-12 text-center">
          <XCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <p className="text-white font-medium">DB status not available</p>
          <p className="text-gray-500 text-sm mt-2">El endpoint /api/v1/db/status no responde</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div
                className={`p-2 rounded-lg ${
                  status.connected ? "bg-green-500/20" : "bg-red-500/20"
                }`}
              >
                {status.connected ? (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-400" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {status.connected ? "Conectado" : "Desconectado"}
                </h2>
                <p className="text-gray-500 text-sm">Estado de conexión</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-gray-400">Provider</span>
                <span className="text-white font-mono">{status.provider ?? "—"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-gray-400">Tenant count</span>
                <span className="text-white">{status.tenant_count ?? "—"}</span>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-bold text-white">Tablas</h2>
            </div>
            {status.tables && status.tables.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {status.tables.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-1 rounded bg-white/5 text-gray-300 text-sm font-mono"
                  >
                    {t}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No hay información de tablas</p>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  );
}

"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Database, RefreshCw, CheckCircle, XCircle, Link, Settings,
  Zap, Users, Activity, Server, Download, ArrowRight, Wifi, WifiOff,
  Plus, Plug, BarChart3, Clock, AlertTriangle, Loader2
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

const API_URL = "https://nadakki-ai-suite.onrender.com";
const TENANT_ID = "credicefi";

interface Integration {
  id: string;
  name: string;
  type: string;
  status: "connected" | "disconnected" | "error";
  last_sync: string;
  stats: Record<string, any>;
  color: string;
}

interface SyncLog {
  integration: string;
  records: number;
  status: string;
  time: string;
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [summary, setSummary] = useState({ total: 0, connected: 0, success_rate: 99.8 });
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [available, setAvailable] = useState<{ id: string; name: string; category: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    fetchIntegrations();
    fetchLogs();
    fetchAvailable();
  }, []);

  const fetchIntegrations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/integrations?tenant_id=${TENANT_ID}`);
      const data = await res.json();
      setIntegrations(data.integrations || []);
      setSummary(data.summary || { total: 0, connected: 0, success_rate: 99.8 });
    } catch (error) {
      console.error("Error fetching integrations:", error);
    }
    setLoading(false);
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API_URL}/api/integrations/logs/recent?tenant_id=${TENANT_ID}`);
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
  };

  const fetchAvailable = async () => {
    try {
      const res = await fetch(`${API_URL}/api/integrations/available`);
      const data = await res.json();
      setAvailable(data.available || []);
    } catch (error) {
      console.error("Error fetching available:", error);
    }
  };

  const toggleConnection = async (id: string, currentStatus: string) => {
    setSyncing(id);
    const endpoint = currentStatus === "connected" ? "disconnect" : "connect";
    try {
      const res = await fetch(`${API_URL}/api/integrations/${id}/${endpoint}?tenant_id=${TENANT_ID}`, { method: "POST" });
      const data = await res.json();
      setIntegrations(integrations.map(i => i.id === id ? { ...i, status: data.status } : i));
      fetchLogs();
    } catch (error) {
      console.error("Error toggling connection:", error);
    }
    setSyncing(null);
  };

  const syncIntegration = async (id: string) => {
    setSyncing(id);
    try {
      await fetch(`${API_URL}/api/integrations/${id}/sync?tenant_id=${TENANT_ID}`, { method: "POST" });
      setIntegrations(integrations.map(i => i.id === id ? { ...i, last_sync: "ahora" } : i));
      fetchLogs();
    } catch (error) {
      console.error("Error syncing:", error);
    }
    setSyncing(null);
  };

  const syncAll = async () => {
    setSyncing("all");
    try {
      await fetch(`${API_URL}/api/integrations/sync-all?tenant_id=${TENANT_ID}`, { method: "POST" });
      fetchIntegrations();
      fetchLogs();
    } catch (error) {
      console.error("Error syncing all:", error);
    }
    setSyncing(null);
  };

  const realtime = integrations.filter(i => i.last_sync?.toLowerCase().includes("real")).length;

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/marketing">
        <StatusBadge status="active" label="Integraciones" size="lg" />
      </NavigationBar>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
              <Database className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Integraciones CDP/CRM</h1>
              <p className="text-gray-400">Conecta todas tus fuentes de datos</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={syncAll} disabled={syncing === "all"}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-xl text-white font-medium disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${syncing === "all" ? "animate-spin" : ""}`} />
              {syncing === "all" ? "Sincronizando..." : "Sync All"}
            </button>
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-xl text-white font-medium">
              <Plus className="w-5 h-5" /> Nueva
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard value={summary.connected.toString()} label="Conectadas" icon={<Link className="w-6 h-6 text-green-400" />} color="#22c55e" />
        <StatCard value={`${summary.total - summary.connected}`} label="Desconectadas" icon={<WifiOff className="w-6 h-6 text-gray-400" />} color="#6b7280" />
        <StatCard value={`${summary.success_rate}%`} label="Success Rate" icon={<BarChart3 className="w-6 h-6 text-purple-400" />} color="#8b5cf6" />
        <StatCard value={realtime.toString()} label="Tiempo Real" icon={<Activity className="w-6 h-6 text-cyan-400" />} color="#06b6d4" />
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin mb-4" />
          <p className="text-gray-400">Cargando integraciones...</p>
        </div>
      ) : (
        <>
          {/* Integrations Grid */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            {integrations.map((int, i) => (
              <motion.div key={int.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <GlassCard className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: int.color + "20" }}>
                        <Server className="w-6 h-6" style={{ color: int.color }} />
                      </div>
                      <div>
                        <h3 className="font-bold text-white">{int.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 text-xs rounded-full bg-white/10 text-gray-400">{int.type}</span>
                          <span className={`px-2 py-0.5 text-xs rounded-full flex items-center gap-1 ${
                            int.status === "connected" ? "bg-green-500/20 text-green-400" : 
                            int.status === "error" ? "bg-red-500/20 text-red-400" : 
                            "bg-gray-500/20 text-gray-400"
                          }`}>
                            {int.status === "connected" ? <><Wifi className="w-3 h-3" /> Conectado</> : 
                             int.status === "error" ? <><AlertTriangle className="w-3 h-3" /> Error</> : 
                             <><WifiOff className="w-3 h-3" /> Desconectado</>}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {int.status === "connected" && (
                        <button onClick={() => syncIntegration(int.id)} disabled={syncing === int.id}
                          className="p-2 hover:bg-blue-500/20 rounded-lg text-blue-400">
                          {syncing === int.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        </button>
                      )}
                      <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400"><Settings className="w-4 h-4" /></button>
                      <button onClick={() => toggleConnection(int.id, int.status)} disabled={syncing === int.id}
                        className={`p-2 rounded-lg ${int.status === "connected" ? "hover:bg-red-500/20 text-red-400" : "hover:bg-green-500/20 text-green-400"}`}>
                        {syncing === int.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                         int.status === "connected" ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {Object.entries(int.stats || {}).slice(0, 3).map(([k, v]) => (
                      <div key={k} className="text-center p-2 bg-white/5 rounded-lg">
                        <div className="text-lg font-bold text-white">{v}</div>
                        <div className="text-xs text-gray-500 capitalize">{k}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {int.last_sync}</span>
                    <button className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">Ver logs <ArrowRight className="w-3 h-3" /></button>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          {/* Sync Logs */}
          {logs.length > 0 && (
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Ultimos Syncs</h3>
                <button className="text-sm text-gray-400 hover:text-white flex items-center gap-1"><Download className="w-4 h-4" /> Exportar</button>
              </div>
              <div className="space-y-2">
                {logs.slice(0, 5).map((log, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      {log.status === "success" ? <CheckCircle className="w-5 h-5 text-green-400" /> : <XCircle className="w-5 h-5 text-red-400" />}
                      <div>
                        <div className="font-medium text-white">{log.integration}</div>
                        <div className="text-sm text-gray-400">{log.records?.toLocaleString() || 0} registros</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-400">{log.time ? new Date(log.time).toLocaleTimeString() : "-"}</div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-[#0a0f1c] border border-white/10 rounded-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-white/10">
                <h3 className="text-xl font-bold text-white">Nueva Integracion</h3>
                <p className="text-sm text-gray-400 mt-1">Selecciona una plataforma para conectar</p>
              </div>
              <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
                {available.map(a => (
                  <button key={a.id} className="w-full p-4 border border-white/10 rounded-xl hover:border-blue-500 hover:bg-blue-500/5 text-left transition-all">
                    <div className="font-medium text-white">{a.name}</div>
                    <div className="text-sm text-gray-400">{a.category}</div>
                  </button>
                ))}
              </div>
              <div className="p-6 border-t border-white/10 flex justify-end gap-3">
                <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400">Cancelar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

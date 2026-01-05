"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Database, RefreshCw, CheckCircle, XCircle, Link, Settings,
  Zap, Users, Activity, Server, Download, ArrowRight, Wifi, WifiOff,
  Plus, Plug, BarChart3, Clock, AlertTriangle
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

interface Integration {
  id: string;
  name: string;
  type: string;
  status: "connected" | "disconnected" | "error";
  lastSync: string;
  stats: Record<string, string | number>;
  color: string;
}

const INTEGRATIONS: Integration[] = [
  { id: "hubspot", name: "HubSpot", type: "CRM", status: "connected", lastSync: "hace 5 min", stats: { contacts: "12.5K", companies: "2.4K", deals: 560 }, color: "#FF7A59" },
  { id: "salesforce", name: "Salesforce", type: "CRM", status: "connected", lastSync: "hace 15 min", stats: { leads: "8.4K", accounts: "1.2K", opportunities: 320 }, color: "#00A1E0" },
  { id: "segment", name: "Segment", type: "CDP", status: "connected", lastSync: "tiempo real", stats: { events: "1.2M/mes", sources: 8, destinations: 12 }, color: "#43AF79" },
  { id: "zapier", name: "Zapier", type: "Automation", status: "connected", lastSync: "hace 2 min", stats: { zaps: 24, tasks: "12K/mes", success: "99.8%" }, color: "#FF4A00" },
  { id: "intercom", name: "Intercom", type: "Support", status: "disconnected", lastSync: "hace 3 días", stats: { conversations: 0, users: 0 }, color: "#1F8BED" },
  { id: "google-analytics", name: "Google Analytics", type: "Analytics", status: "connected", lastSync: "hace 1 hora", stats: { sessions: "45K/mes", users: "28K", bounce: "42%" }, color: "#F9AB00" },
  { id: "stripe", name: "Stripe", type: "Payments", status: "connected", lastSync: "hace 10 min", stats: { revenue: "$125K/mes", customers: "4.2K", mrr: "$42K" }, color: "#635BFF" },
  { id: "slack", name: "Slack", type: "Comms", status: "connected", lastSync: "tiempo real", stats: { channels: 8, messages: "2.4K/día" }, color: "#4A154B" },
];

const SYNC_LOGS = [
  { id: 1, integration: "HubSpot", type: "contacts", status: "success", count: 1250, time: "14:30" },
  { id: 2, integration: "Salesforce", type: "leads", status: "success", count: 320, time: "14:25" },
  { id: 3, integration: "Segment", type: "events", status: "success", count: 8420, time: "14:20" },
  { id: 4, integration: "Stripe", type: "customers", status: "error", count: 0, time: "14:15" },
  { id: 5, integration: "Google Analytics", type: "sessions", status: "success", count: 1560, time: "14:10" },
];

const AVAILABLE = [
  { id: "microsoft", name: "Microsoft Dynamics", category: "CRM" },
  { id: "marketo", name: "Marketo", category: "Marketing" },
  { id: "braze", name: "Braze", category: "CDP" },
  { id: "mixpanel", name: "Mixpanel", category: "Analytics" },
  { id: "amplitude", name: "Amplitude", category: "Analytics" },
];

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState(INTEGRATIONS);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const toggleConnection = async (id: string) => {
    setSyncing(id);
    await new Promise(r => setTimeout(r, 1500));
    setIntegrations(integrations.map(i => i.id === id ? { ...i, status: i.status === "connected" ? "disconnected" : "connected" } : i));
    setSyncing(null);
  };

  const syncAll = async () => {
    setSyncing("all");
    await new Promise(r => setTimeout(r, 2000));
    setSyncing(null);
  };

  const connected = integrations.filter(i => i.status === "connected").length;

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
        <StatCard value={connected.toString()} label="Conectadas" icon={<Link className="w-6 h-6 text-green-400" />} color="#22c55e" />
        <StatCard value="48K+" label="Puntos de Datos" icon={<Database className="w-6 h-6 text-blue-400" />} color="#3b82f6" />
        <StatCard value="99.8%" label="Success Rate" icon={<BarChart3 className="w-6 h-6 text-purple-400" />} color="#8b5cf6" />
        <StatCard value="3/8" label="Tiempo Real" icon={<Activity className="w-6 h-6 text-cyan-400" />} color="#06b6d4" />
      </div>

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
                      <span className={`px-2 py-0.5 text-xs rounded-full flex items-center gap-1 ${int.status === "connected" ? "bg-green-500/20 text-green-400" : int.status === "error" ? "bg-red-500/20 text-red-400" : "bg-gray-500/20 text-gray-400"}`}>
                        {int.status === "connected" ? <><Wifi className="w-3 h-3" /> Conectado</> : int.status === "error" ? <><AlertTriangle className="w-3 h-3" /> Error</> : <><WifiOff className="w-3 h-3" /> Desconectado</>}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400"><Settings className="w-4 h-4" /></button>
                  <button onClick={() => toggleConnection(int.id)} disabled={syncing === int.id}
                    className={`p-2 rounded-lg ${int.status === "connected" ? "hover:bg-red-500/20 text-red-400" : "hover:bg-green-500/20 text-green-400"}`}>
                    {syncing === int.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : int.status === "connected" ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                {Object.entries(int.stats).slice(0, 3).map(([k, v]) => (
                  <div key={k} className="text-center p-2 bg-white/5 rounded-lg">
                    <div className="text-lg font-bold text-white">{v}</div>
                    <div className="text-xs text-gray-500 capitalize">{k}</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {int.lastSync}</span>
                <button className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">Ver logs <ArrowRight className="w-3 h-3" /></button>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Sync Logs */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Últimos Syncs</h3>
          <button className="text-sm text-gray-400 hover:text-white flex items-center gap-1"><Download className="w-4 h-4" /> Exportar</button>
        </div>
        <div className="space-y-2">
          {SYNC_LOGS.map(log => (
            <div key={log.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-3">
                {log.status === "success" ? <CheckCircle className="w-5 h-5 text-green-400" /> : <XCircle className="w-5 h-5 text-red-400" />}
                <div>
                  <div className="font-medium text-white">{log.integration}</div>
                  <div className="text-sm text-gray-400">{log.type}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-white">{log.count.toLocaleString()} registros</div>
                <div className="text-sm text-gray-400">{log.time}</div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Add Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-[#0a0f1c] border border-white/10 rounded-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-white/10">
                <h3 className="text-xl font-bold text-white">Nueva Integración</h3>
              </div>
              <div className="p-6 space-y-3">
                {AVAILABLE.map(a => (
                  <button key={a.id} className="w-full p-4 border border-white/10 rounded-xl hover:border-blue-500 hover:bg-blue-500/5 text-left">
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

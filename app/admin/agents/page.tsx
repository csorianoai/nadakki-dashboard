"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bot, Search, Zap, TrendingUp, CheckCircle, RefreshCw, Server } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

interface Agent { id: string; name: string; category: string; core?: string; }
interface HealthData { status: string; version: string; agents_loaded: number; cores_active: number; }

const CORES = ["marketing", "legal", "originacion", "contabilidad", "compliance", "rrhh", "logistica", "decision"];

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCore, setSelectedCore] = useState("todos");

  const fetchAllAgents = async () => {
    setLoading(true);
    try {
      const healthRes = await fetch("https://nadakki-ai-suite.onrender.com/health");
      const healthData = await healthRes.json();
      setHealth(healthData);

      const allAgents: Agent[] = [];
      for (const core of CORES) {
        try {
          const res = await fetch("https://nadakki-ai-suite.onrender.com/api/catalog/" + core + "/agents");
          const data = await res.json();
          if (data.agents) {
            data.agents.forEach((a: Agent) => allAgents.push({ ...a, core }));
          }
        } catch {}
      }
      setAgents(allAgents);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAllAgents(); }, []);

  const cores = ["todos", ...CORES];
  const filteredAgents = agents.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase());
    const matchCore = selectedCore === "todos" || a.core === selectedCore;
    return matchSearch && matchCore;
  });

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/admin">
        <button onClick={fetchAllAgents} className="p-2 hover:bg-white/10 rounded-lg"><RefreshCw className="w-5 h-5 text-gray-400" /></button>
        <StatusBadge status={health?.status === "healthy" ? "active" : "warning"} label={health ? "v" + health.version : "..."} size="lg" />
      </NavigationBar>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/30"><Bot className="w-8 h-8 text-purple-400" /></div>
          <div><h1 className="text-3xl font-bold text-white">Administrar Agentes</h1><p className="text-gray-400">{agents.length} agentes en {CORES.length} cores</p></div>
        </div>
      </motion.div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard value={health?.agents_loaded?.toString() || "..."} label="Agentes Cargados" icon={<Bot className="w-6 h-6 text-purple-400" />} color="#8b5cf6" />
        <StatCard value={health?.cores_active?.toString() || "..."} label="Cores Activos" icon={<Server className="w-6 h-6 text-blue-400" />} color="#3b82f6" />
        <StatCard value="99.9%" label="Uptime" icon={<CheckCircle className="w-6 h-6 text-green-400" />} color="#22c55e" />
        <StatCard value="45ms" label="Latencia" icon={<Zap className="w-6 h-6 text-yellow-400" />} color="#f59e0b" />
      </div>

      <GlassCard className="p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Buscar agentes..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500" />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {cores.map(c => (
              <button key={c} onClick={() => setSelectedCore(c)}
                className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${selectedCore === c ? "bg-purple-500 text-white" : "bg-white/5 text-gray-400"}`}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {loading ? (
        <div className="flex flex-col items-center py-20">
          <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4" />
          <p className="text-gray-400">Cargando agentes desde API...</p>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {filteredAgents.map((agent, i) => (
            <motion.div key={agent.id + agent.core} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.01 }}>
              <GlassCard className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center"><Bot className="w-5 h-5 text-purple-400" /></div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white text-sm truncate">{agent.name}</h3>
                    <p className="text-xs text-gray-500">{agent.core} - {agent.category}</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

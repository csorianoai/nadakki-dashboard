"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Bot, Search, Zap, TrendingUp, CheckCircle, ArrowRight, RefreshCw } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

interface Agent { id: string; name: string; category: string; }

export default function MarketingAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");

  const fetchAgents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("https://nadakki-ai-suite.onrender.com/api/catalog/marketing/agents");
      if (!res.ok) throw new Error("Error en la API");
      const data = await res.json();
      if (data.agents && Array.isArray(data.agents)) {
        setAgents(data.agents);
      } else {
        throw new Error("Formato de respuesta invalido");
      }
    } catch (err) {
      setError("Error cargando agentes. Intenta de nuevo.");
      console.error("Error fetching agents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const categories = ["Todos", ...Array.from(new Set(agents.map(a => a.category)))];

  const filteredAgents = agents.filter(agent => {
    const matchSearch = agent.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === "Todos" || agent.category === category;
    return matchSearch && matchCategory;
  });

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/marketing">
        <StatusBadge status={agents.length > 0 ? "active" : "warning"} label={agents.length + " Agentes"} size="lg" />
      </NavigationBar>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
            <Bot className="w-8 h-8 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Marketing AI Agents</h1>
            <p className="text-gray-400">{agents.length} agentes especializados en marketing</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard value={agents.length.toString()} label="Total Agentes" icon={<Bot className="w-6 h-6 text-cyan-400" />} color="#06b6d4" />
        <StatCard value={agents.length.toString()} label="Activos" icon={<CheckCircle className="w-6 h-6 text-green-400" />} color="#22c55e" />
        <StatCard value="98.5%" label="Precision" icon={<TrendingUp className="w-6 h-6 text-yellow-400" />} color="#f59e0b" />
        <StatCard value="45ms" label="Latencia" icon={<Zap className="w-6 h-6 text-purple-400" />} color="#8b5cf6" />
      </div>

      <GlassCard className="p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Buscar agentes..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50" />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            {categories.slice(0, 6).map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${category === cat ? "bg-cyan-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mb-4" />
          <p className="text-gray-400">Cargando agentes desde API...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={fetchAgents} className="px-4 py-2 bg-cyan-500 text-white rounded-lg flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Reintentar
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filteredAgents.map((agent, i) => (
            <motion.div key={agent.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
              <Link href={"/marketing/agents/" + agent.id}>
                <GlassCard className="p-5 cursor-pointer group h-full">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                      <Bot className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white truncate group-hover:text-cyan-400 transition-colors">{agent.name}</h3>
                      <p className="text-xs text-gray-400">{agent.category}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </GlassCard>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

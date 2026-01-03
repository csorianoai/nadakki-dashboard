"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bot, Search, Filter, Play, Pause, Trash2, 
  Edit, Eye, RefreshCw, Download, Plus,
  CheckCircle, XCircle, AlertCircle
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface Agent {
  id: string;
  name: string;
  category: string;
  status: "active" | "inactive";
  accuracy: number;
  latency: number;
  executions: number;
}

const CATEGORIES = ["Todos", "Marketing", "Content", "Analytics", "Compliance", "Finanzas"];

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");
  const [apiStatus, setApiStatus] = useState<"live" | "mock">("mock");

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await fetch("https://nadakki-ai-suite.onrender.com/api/catalog/marketing/agents");
        if (res.ok) {
          const data = await res.json();
          setAgents(data.agents.map((a: any, i: number) => ({
            id: a.id,
            name: a.name,
            category: "Marketing",
            status: "active",
            accuracy: 85 + Math.random() * 15,
            latency: 50 + Math.random() * 200,
            executions: Math.floor(Math.random() * 2000)
          })));
          setApiStatus("live");
        }
      } catch {
        setAgents([
          { id: "leadscoringia", name: "Lead Scoring IA", category: "Marketing", status: "active", accuracy: 94.2, latency: 120, executions: 1250 },
          { id: "contentgeneratoria", name: "Content Generator", category: "Content", status: "active", accuracy: 91.5, latency: 450, executions: 890 },
          { id: "sentimentanalyzeria", name: "Sentiment Analyzer", category: "Analytics", status: "active", accuracy: 96.8, latency: 180, executions: 2100 },
          { id: "compliancecheckingia", name: "Compliance Checker", category: "Compliance", status: "inactive", accuracy: 98.1, latency: 320, executions: 456 },
          { id: "frauddetectoria", name: "Fraud Detector", category: "Finanzas", status: "active", accuracy: 97.3, latency: 90, executions: 3200 },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchAgents();
  }, []);

  const filteredAgents = agents.filter(agent => {
    const matchSearch = agent.name.toLowerCase().includes(search.toLowerCase()) || agent.id.includes(search.toLowerCase());
    const matchCategory = category === "Todos" || agent.category === category;
    return matchSearch && matchCategory;
  });

  const toggleStatus = (id: string) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, status: a.status === "active" ? "inactive" : "active" } : a));
  };

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/admin">
        <div className="flex items-center gap-3">
          <StatusBadge status={apiStatus === "live" ? "active" : "warning"} label={apiStatus === "live" ? "API Live" : "Demo Mode"} />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg font-medium text-white text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Nuevo Agente
          </motion.button>
        </div>
      </NavigationBar>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/30">
            <Bot className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Gestión de Agentes IA</h1>
            <p className="text-gray-400">{agents.length} agentes registrados • {agents.filter(a => a.status === "active").length} activos</p>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <GlassCard className="p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar agentes por nombre o ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${category === cat ? "bg-purple-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Table */}
      <GlassCard className="overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <LoadingSpinner size="lg" text="Cargando agentes..." />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Estado</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Agente</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Categoría</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Precisión</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Latencia</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Ejecuciones</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredAgents.map((agent, i) => (
                  <motion.tr
                    key={agent.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <button onClick={() => toggleStatus(agent.id)}>
                        {agent.status === "active" ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-gray-500" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-white">{agent.name}</p>
                        <p className="text-xs text-gray-500 font-mono">{agent.id}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full text-xs bg-white/5 text-gray-300">{agent.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full" style={{ width: agent.accuracy + "%" }} />
                        </div>
                        <span className="text-sm text-green-400">{agent.accuracy.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm ${agent.latency < 150 ? "text-green-400" : agent.latency < 300 ? "text-yellow-400" : "text-red-400"}`}>
                        {agent.latency.toFixed(0)}ms
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-300">{agent.executions.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Ejecutar">
                          <Play className="w-4 h-4 text-gray-400 hover:text-green-400" />
                        </button>
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Editar">
                          <Edit className="w-4 h-4 text-gray-400 hover:text-blue-400" />
                        </button>
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Eliminar">
                          <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </GlassCard>
    </div>
  );
}

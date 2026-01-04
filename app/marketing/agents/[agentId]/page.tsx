"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Bot, Play, Clock, CheckCircle, Loader2, Zap } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

interface AgentDetails {
  id: string;
  name: string;
  description: string;
  category: string;
  executions: number;
  successRate: string;
  avgTime: string;
  lastRun: string;
}

const MOCK_AGENTS: Record<string, AgentDetails> = {
  "leadscoringia": { id: "leadscoringia", name: "Lead Scoring IA", description: "Analiza y puntua leads automaticamente", category: "Leads", executions: 12450, successRate: "98.5%", avgTime: "1.2s", lastRun: "Hace 5 min" },
  "contentgeneratoria": { id: "contentgeneratoria", name: "Content Generator IA", description: "Genera contenido optimizado", category: "Content", executions: 5670, successRate: "96.8%", avgTime: "3.5s", lastRun: "Hace 2 min" },
  "socialpostgeneratoria": { id: "socialpostgeneratoria", name: "Social Post Generator IA", description: "Crea posts para redes sociales", category: "Social", executions: 7890, successRate: "97.8%", avgTime: "1.5s", lastRun: "Hace 1 min" },
};

export default function AgentDetailPage() {
  const params = useParams();
  const agentId = params.agentId as string;
  const [agent, setAgent] = useState<AgentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      if (MOCK_AGENTS[agentId]) {
        setAgent(MOCK_AGENTS[agentId]);
      } else {
        setAgent({
          id: agentId,
          name: agentId.replace(/ia$/i, " IA").replace(/([A-Z])/g, " $1").trim(),
          description: "Agente de IA especializado en marketing",
          category: "Marketing",
          executions: Math.floor(Math.random() * 10000),
          successRate: (95 + Math.random() * 4).toFixed(1) + "%",
          avgTime: (0.5 + Math.random() * 3).toFixed(1) + "s",
          lastRun: "Hace " + Math.floor(Math.random() * 60) + " min"
        });
      }
      setLoading(false);
    }, 500);
  }, [agentId]);

  const executeAgent = async () => {
    setExecuting(true);
    setResult(null);
    await new Promise(r => setTimeout(r, 2500));
    setResult("Ejecucion completada. Procesados 125 registros.");
    setExecuting(false);
  };

  if (loading) {
    return (
      <div className="ndk-page ndk-fade-in flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!agent) return null;

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/marketing/agents">
        <StatusBadge status="active" label="Activo" size="lg" />
      </NavigationBar>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
            <Bot className="w-10 h-10 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{agent.name}</h1>
            <p className="text-gray-400 mt-1">{agent.description}</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard value={agent.executions.toLocaleString()} label="Ejecuciones" icon={<Play className="w-6 h-6 text-green-400" />} color="#22c55e" />
        <StatCard value={agent.successRate} label="Tasa Exito" icon={<CheckCircle className="w-6 h-6 text-cyan-400" />} color="#06b6d4" />
        <StatCard value={agent.avgTime} label="Tiempo Prom" icon={<Clock className="w-6 h-6 text-yellow-400" />} color="#f59e0b" />
        <StatCard value={agent.lastRun} label="Ultima Ejec" icon={<Zap className="w-6 h-6 text-purple-400" />} color="#8b5cf6" />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <h3 className="text-lg font-bold text-white mb-4">Ejecutar Agente</h3>
          <motion.button whileHover={{ scale: 1.02 }} onClick={executeAgent} disabled={executing}
            className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 ${executing ? "bg-gray-600" : "bg-gradient-to-r from-cyan-500 to-blue-500"}`}>
            {executing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
            {executing ? "Ejecutando..." : "Ejecutar Ahora"}
          </motion.button>
          {result && (
            <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
              <p className="text-sm text-green-400">{result}</p>
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-lg font-bold text-white mb-4">Info</h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-white/10"><span className="text-gray-400">ID</span><span className="text-white font-mono text-sm">{agent.id}</span></div>
            <div className="flex justify-between py-2 border-b border-white/10"><span className="text-gray-400">Categoria</span><span className="text-white">{agent.category}</span></div>
            <div className="flex justify-between py-2"><span className="text-gray-400">Version</span><span className="text-white">v2.1.0</span></div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

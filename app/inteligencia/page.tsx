"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Zap, Bot, CheckCircle, Clock, Search, ArrowRight, RefreshCw } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

interface Agent { id: string; name: string; category: string; }

export default function InteligenciaPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const res = await fetch("${process.env.NEXT_PUBLIC_API_BASE_URL}/api/catalog/inteligencia/agents");
      const data = await res.json();
      if (data.agents) setAgents(data.agents);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAgents(); }, []);
  const filteredAgents = agents.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/"><button onClick={fetchAgents} className="p-2 hover:bg-white/10 rounded-lg"><RefreshCw className="w-5 h-5 text-gray-400" /></button><StatusBadge status="active" label="Inteligencia" size="lg" /></NavigationBar>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-violet-500/20 border border-purple-500/30"><Zap className="w-10 h-10 text-purple-400" /></div>
          <div><h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">Inteligencia</h1><p className="text-gray-400 mt-1">{agents.length} agentes de IA</p></div>
        </div>
      </motion.div>
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard value={agents.length.toString()} label="Agentes" icon={<Bot className="w-6 h-6 text-purple-400" />} color="#a855f7" />
        <StatCard value="6" label="Modelos" icon={<Zap className="w-6 h-6 text-violet-400" />} color="#8b5cf6" />
        <StatCard value="99%" label="Precision" icon={<CheckCircle className="w-6 h-6 text-green-400" />} color="#22c55e" />
        <StatCard value="< 1s" label="Tiempo" icon={<Clock className="w-6 h-6 text-yellow-400" />} color="#f59e0b" />
      </div>
      <GlassCard className="p-4 mb-6"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" placeholder="Buscar agentes..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500" /></div></GlassCard>
      {loading ? (<div className="flex flex-col items-center py-20"><div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4" /><p className="text-gray-400">Cargando agentes...</p></div>) : (
        <div className="grid grid-cols-3 gap-4">{filteredAgents?.map((agent, i) => (<motion.div key={agent.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}><Link href={'/inteligencia/' + agent.id}><GlassCard className="p-5 cursor-pointer group h-full hover:bg-white/10 transition-all"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-violet-500/20 flex items-center justify-center"><Zap className="w-6 h-6 text-purple-400" /></div><div className="flex-1 min-w-0"><h3 className="font-bold text-white truncate group-hover:text-purple-400 transition-colors">{agent.name}</h3><p className="text-xs text-gray-400">{agent.category}</p></div><ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-purple-400 transition-all" /></div></GlassCard></Link></motion.div>))}</div>
      )}
    </div>
  );
}



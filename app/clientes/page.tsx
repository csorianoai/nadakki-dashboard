"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { UserCircle, Bot, CheckCircle, Clock, Search, ArrowRight, RefreshCw } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

interface Agent { id: string; name: string; category: string; }

export default function ClientesPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const res = await fetch("https://nadakki-ai-suite.onrender.com/api/catalog/clientes/agents");
      const data = await res.json();
      if (data.agents) setAgents(data.agents);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAgents(); }, []);
  const filteredAgents = agents.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/"><button onClick={fetchAgents} className="p-2 hover:bg-white/10 rounded-lg"><RefreshCw className="w-5 h-5 text-gray-400" /></button><StatusBadge status="active" label="Clientes" size="lg" /></NavigationBar>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-500/20 to-blue-500/20 border border-sky-500/30"><UserCircle className="w-10 h-10 text-sky-400" /></div>
          <div><h1 className="text-4xl font-bold bg-gradient-to-r from-sky-400 to-blue-400 bg-clip-text text-transparent">Clientes</h1><p className="text-gray-400 mt-1">{agents.length} agentes de IA</p></div>
        </div>
      </motion.div>
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard value={agents.length.toString()} label="Agentes" icon={<Bot className="w-6 h-6 text-sky-400" />} color="#0ea5e9" />
        <StatCard value="15" label="Segmentos" icon={<UserCircle className="w-6 h-6 text-blue-400" />} color="#3b82f6" />
        <StatCard value="98%" label="Satisfaccion" icon={<CheckCircle className="w-6 h-6 text-green-400" />} color="#22c55e" />
        <StatCard value="< 2s" label="Tiempo" icon={<Clock className="w-6 h-6 text-yellow-400" />} color="#f59e0b" />
      </div>
      <GlassCard className="p-4 mb-6"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" placeholder="Buscar agentes..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500" /></div></GlassCard>
      {loading ? (<div className="flex flex-col items-center py-20"><div className="w-12 h-12 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin mb-4" /><p className="text-gray-400">Cargando agentes...</p></div>) : agents.length > 0 ? (
        <div className="grid grid-cols-3 gap-4">{filteredAgents.map((agent, i) => (<motion.div key={agent.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}><Link href={'/clientes/' + agent.id}><GlassCard className="p-5 cursor-pointer group h-full hover:bg-white/10 transition-all"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-500/20 flex items-center justify-center"><UserCircle className="w-6 h-6 text-sky-400" /></div><div className="flex-1 min-w-0"><h3 className="font-bold text-white truncate group-hover:text-sky-400 transition-colors">{agent.name}</h3><p className="text-xs text-gray-400">{agent.category}</p></div><ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-sky-400 transition-all" /></div></GlassCard></Link></motion.div>))}</div>
      ) : (<GlassCard className="p-8 text-center"><p className="text-gray-400">API en desarrollo - Agentes proximamente</p></GlassCard>)}
    </div>
  );
}

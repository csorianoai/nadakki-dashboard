"use client";
import { motion } from "framer-motion";
import { 
  PhoneCall, DollarSign, Calendar, TrendingUp,
  Bot, CheckCircle, AlertTriangle, Users
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

const COLLECTION_STAGES = [
  { name: "Preventiva", desc: "Recordatorios antes del vencimiento", agents: 2, recovered: "85%", color: "#22c55e" },
  { name: "Temprana", desc: "1-30 días de mora", agents: 3, recovered: "72%", color: "#f59e0b" },
  { name: "Intermedia", desc: "31-60 días de mora", agents: 2, recovered: "45%", color: "#f97316" },
  { name: "Tardía", desc: "60+ días de mora", agents: 3, recovered: "28%", color: "#ef4444" },
];

export default function CobranzaPage() {
  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/">
        <StatusBadge status="active" label="Cobranza Core" size="lg" />
      </NavigationBar>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30">
            <PhoneCall className="w-10 h-10 text-red-400" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              Sistema de Cobranza IA
            </h1>
            <p className="text-gray-400 mt-1">10 agentes de IA para recuperación de cartera</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard value="10" label="Agentes" icon={<Bot className="w-6 h-6 text-red-400" />} color="#ef4444" />
        <StatCard value="$2.5M" label="Recuperado/mes" icon={<DollarSign className="w-6 h-6 text-green-400" />} color="#22c55e" />
        <StatCard value="68%" label="Tasa Recuperación" icon={<TrendingUp className="w-6 h-6 text-blue-400" />} color="#3b82f6" />
        <StatCard value="45K" label="Contactos/mes" icon={<Users className="w-6 h-6 text-purple-400" />} color="#8b5cf6" />
      </div>

      <h2 className="text-xl font-bold text-white mb-4">Etapas de Cobranza</h2>
      <div className="grid grid-cols-2 gap-6">
        {COLLECTION_STAGES.map((stage, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <GlassCard className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl" style={{ backgroundColor: stage.color + "20" }}>
                  <PhoneCall className="w-6 h-6" style={{ color: stage.color }} />
                </div>
                <span className="text-2xl font-bold" style={{ color: stage.color }}>{stage.recovered}</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{stage.name}</h3>
              <p className="text-sm text-gray-400 mb-3">{stage.desc}</p>
              <p className="text-xs text-gray-500">{stage.agents} agentes • Tasa recuperación</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

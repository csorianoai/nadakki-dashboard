"use client";
import { motion } from "framer-motion";
import { 
  Vault, TrendingUp, ArrowUpDown, PiggyBank,
  Bot, CheckCircle, DollarSign, BarChart3
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

const TREASURY_MODULES = [
  { name: "Cash Management", desc: "Gestión de flujo de efectivo", agents: 4, icon: DollarSign, color: "#22c55e" },
  { name: "Inversiones", desc: "Optimización de portafolio", agents: 4, icon: TrendingUp, color: "#3b82f6" },
  { name: "FX Management", desc: "Gestión de divisas", agents: 3, icon: ArrowUpDown, color: "#f59e0b" },
  { name: "Forecasting", desc: "Proyecciones financieras", agents: 4, icon: BarChart3, color: "#8b5cf6" },
];

export default function TesoreriaPage() {
  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/">
        <StatusBadge status="active" label="Tesorería Core" size="lg" />
      </NavigationBar>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border border-yellow-500/30">
            <Vault className="w-10 h-10 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">
              Tesorería Inteligente
            </h1>
            <p className="text-gray-400 mt-1">15 agentes de IA para gestión financiera</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard value="15" label="Agentes" icon={<Bot className="w-6 h-6 text-yellow-400" />} color="#f59e0b" />
        <StatCard value="$45M" label="AUM" icon={<PiggyBank className="w-6 h-6 text-green-400" />} color="#22c55e" />
        <StatCard value="+12%" label="ROI YTD" icon={<TrendingUp className="w-6 h-6 text-cyan-400" />} color="#06b6d4" />
        <StatCard value="99.8%" label="Precisión" icon={<CheckCircle className="w-6 h-6 text-purple-400" />} color="#8b5cf6" />
      </div>

      <h2 className="text-xl font-bold text-white mb-4">Módulos de Tesorería</h2>
      <div className="grid grid-cols-2 gap-6">
        {TREASURY_MODULES.map((module, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <GlassCard className="p-6 cursor-pointer group">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl" style={{ backgroundColor: module.color + "20" }}>
                  <module.icon className="w-6 h-6" style={{ color: module.color }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white group-hover:text-yellow-400 transition-colors">{module.name}</h3>
                  <p className="text-sm text-gray-400 mt-1">{module.desc}</p>
                  <p className="text-xs text-gray-500 mt-3">{module.agents} agentes</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

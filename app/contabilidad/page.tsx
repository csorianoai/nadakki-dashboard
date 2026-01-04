"use client";
import { motion } from "framer-motion";
import { 
  Calculator, FileSpreadsheet, Receipt, TrendingUp,
  Bot, CheckCircle, DollarSign, PieChart
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

const MODULES = [
  { name: "Cuentas por Cobrar", agents: 5, icon: Receipt, color: "#22c55e" },
  { name: "Cuentas por Pagar", agents: 4, icon: DollarSign, color: "#ef4444" },
  { name: "Conciliación", agents: 4, icon: FileSpreadsheet, color: "#3b82f6" },
  { name: "Reportes Financieros", agents: 5, icon: PieChart, color: "#8b5cf6" },
  { name: "Auditoría", agents: 4, icon: CheckCircle, color: "#f59e0b" },
];

export default function ContabilidadPage() {
  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/">
        <StatusBadge status="active" label="Contabilidad Core" size="lg" />
      </NavigationBar>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
            <Calculator className="w-10 h-10 text-blue-400" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Sistema Contable IA
            </h1>
            <p className="text-gray-400 mt-1">22 agentes de IA para automatización contable</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard value="22" label="Agentes" icon={<Bot className="w-6 h-6 text-blue-400" />} color="#3b82f6" />
        <StatCard value="5" label="Módulos" icon={<Calculator className="w-6 h-6 text-cyan-400" />} color="#06b6d4" />
        <StatCard value="99.5%" label="Precisión" icon={<CheckCircle className="w-6 h-6 text-green-400" />} color="#22c55e" />
        <StatCard value="24/7" label="Operación" icon={<TrendingUp className="w-6 h-6 text-purple-400" />} color="#8b5cf6" />
      </div>

      <h2 className="text-xl font-bold text-white mb-4">Módulos Contables</h2>
      <div className="grid grid-cols-3 gap-6">
        {MODULES.map((module, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <GlassCard className="p-6 cursor-pointer group">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl" style={{ backgroundColor: module.color + "20" }}>
                  <module.icon className="w-6 h-6" style={{ color: module.color }} />
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-gray-400">{module.agents} agentes</span>
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{module.name}</h3>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

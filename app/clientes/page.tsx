"use client";
import { motion } from "framer-motion";
import { 
  UserCircle, MessageSquare, Star, HeartHandshake,
  Bot, CheckCircle, TrendingUp, Users
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

const CRM_MODULES = [
  { name: "Customer 360", desc: "Vista integral del cliente", agents: 4, icon: UserCircle, color: "#8b5cf6" },
  { name: "Support AI", desc: "Atención automatizada", agents: 5, icon: MessageSquare, color: "#22c55e" },
  { name: "Loyalty", desc: "Programas de fidelización", agents: 3, icon: Star, color: "#f59e0b" },
  { name: "Retention", desc: "Estrategias de retención", agents: 3, icon: HeartHandshake, color: "#ec4899" },
];

export default function ClientesPage() {
  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/">
        <StatusBadge status="active" label="CRM Core" size="lg" />
      </NavigationBar>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 border border-pink-500/30">
            <Users className="w-10 h-10 text-pink-400" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
              Gestión de Clientes
            </h1>
            <p className="text-gray-400 mt-1">15 agentes de IA para experiencia del cliente</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard value="15" label="Agentes" icon={<Bot className="w-6 h-6 text-pink-400" />} color="#ec4899" />
        <StatCard value="12.5K" label="Clientes Activos" icon={<Users className="w-6 h-6 text-blue-400" />} color="#3b82f6" />
        <StatCard value="4.8" label="NPS Score" icon={<Star className="w-6 h-6 text-yellow-400" />} color="#f59e0b" />
        <StatCard value="92%" label="Retención" icon={<HeartHandshake className="w-6 h-6 text-green-400" />} color="#22c55e" />
      </div>

      <h2 className="text-xl font-bold text-white mb-4">Módulos CRM</h2>
      <div className="grid grid-cols-2 gap-6">
        {CRM_MODULES.map((module, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <GlassCard className="p-6 cursor-pointer group">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl" style={{ backgroundColor: module.color + "20" }}>
                  <module.icon className="w-6 h-6" style={{ color: module.color }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white group-hover:text-pink-400 transition-colors">{module.name}</h3>
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

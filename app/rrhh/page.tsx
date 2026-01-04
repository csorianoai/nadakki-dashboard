"use client";
import { motion } from "framer-motion";
import { 
  Users, UserPlus, Calendar, Award,
  Bot, CheckCircle, TrendingUp, Briefcase
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

const HR_MODULES = [
  { name: "Reclutamiento", desc: "Selección y evaluación de candidatos", agents: 3, icon: UserPlus, color: "#8b5cf6" },
  { name: "Onboarding", desc: "Integración de nuevos empleados", agents: 2, icon: Users, color: "#22c55e" },
  { name: "Evaluación", desc: "Evaluación de desempeño", agents: 2, icon: Award, color: "#f59e0b" },
  { name: "Nómina", desc: "Gestión de compensaciones", agents: 3, icon: Briefcase, color: "#3b82f6" },
];

export default function RRHHPage() {
  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/">
        <StatusBadge status="active" label="RRHH Core" size="lg" />
      </NavigationBar>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30">
            <Users className="w-10 h-10 text-violet-400" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              Recursos Humanos IA
            </h1>
            <p className="text-gray-400 mt-1">10 agentes de IA para gestión de talento</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard value="10" label="Agentes" icon={<Bot className="w-6 h-6 text-violet-400" />} color="#8b5cf6" />
        <StatCard value="4" label="Módulos" icon={<Briefcase className="w-6 h-6 text-blue-400" />} color="#3b82f6" />
        <StatCard value="156" label="Procesos/mes" icon={<TrendingUp className="w-6 h-6 text-green-400" />} color="#22c55e" />
        <StatCard value="95%" label="Satisfacción" icon={<Award className="w-6 h-6 text-yellow-400" />} color="#f59e0b" />
      </div>

      <h2 className="text-xl font-bold text-white mb-4">Módulos de RRHH</h2>
      <div className="grid grid-cols-2 gap-6">
        {HR_MODULES.map((module, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <GlassCard className="p-6 cursor-pointer group">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl" style={{ backgroundColor: module.color + "20" }}>
                  <module.icon className="w-6 h-6" style={{ color: module.color }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white group-hover:text-violet-400 transition-colors">{module.name}</h3>
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

"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Scale, FileText, Shield, AlertTriangle, 
  Search, CheckCircle, Clock, Bot
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const LEGAL_MODULES = [
  { id: "contracts", name: "Contract Analysis", icon: FileText, desc: "Análisis y revisión de contratos", agents: 8, color: "#8b5cf6" },
  { id: "compliance", name: "Compliance Check", icon: Shield, desc: "Verificación de cumplimiento", agents: 6, color: "#22c55e" },
  { id: "risk", name: "Risk Assessment", icon: AlertTriangle, desc: "Evaluación de riesgos legales", agents: 5, color: "#f59e0b" },
  { id: "research", name: "Legal Research", icon: Search, desc: "Investigación jurídica", agents: 7, color: "#3b82f6" },
  { id: "documents", name: "Document Generation", icon: FileText, desc: "Generación de documentos", agents: 6, color: "#ec4899" },
];

export default function LegalPage() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/">
        <StatusBadge status="active" label="Legal AI System" size="lg" />
      </NavigationBar>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30">
            <Scale className="w-10 h-10 text-purple-400" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Legal AI System
            </h1>
            <p className="text-gray-400 mt-1">32 agentes de IA para análisis legal y compliance</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard value="32" label="Agentes Legales" icon={<Bot className="w-6 h-6 text-purple-400" />} color="#8b5cf6" />
        <StatCard value="5" label="Módulos" icon={<Scale className="w-6 h-6 text-indigo-400" />} color="#6366f1" />
        <StatCard value="99.2%" label="Precisión" icon={<CheckCircle className="w-6 h-6 text-green-400" />} color="#22c55e" />
        <StatCard value="< 2s" label="Tiempo Resp." icon={<Clock className="w-6 h-6 text-cyan-400" />} color="#06b6d4" />
      </div>

      <h2 className="text-xl font-bold text-white mb-4">Módulos Legales</h2>
      <div className="grid grid-cols-3 gap-6 mb-8">
        {LEGAL_MODULES.map((module, i) => (
          <motion.div key={module.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <GlassCard className="p-6 cursor-pointer group h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl" style={{ backgroundColor: module.color + "20" }}>
                  <module.icon className="w-6 h-6" style={{ color: module.color }} />
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-gray-400">{module.agents} agentes</span>
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors mb-2">{module.name}</h3>
              <p className="text-sm text-gray-400">{module.desc}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <GlassCard className="p-6">
        <h3 className="text-lg font-bold text-white mb-4">Análisis Rápido</h3>
        <div className="flex items-center gap-4">
          <input type="text" placeholder="Sube un documento o describe tu consulta legal..." 
            className="flex-1 p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500" />
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="px-6 py-4 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl font-bold text-white">
            Analizar
          </motion.button>
        </div>
      </GlassCard>
    </div>
  );
}

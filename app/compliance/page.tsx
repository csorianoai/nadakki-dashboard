"use client";
import { motion } from "framer-motion";
import { 
  Shield, AlertTriangle, CheckCircle, FileSearch,
  Bot, Clock, Eye, Lock
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

const COMPLIANCE_AREAS = [
  { name: "KYC/AML", desc: "Verificación de identidad y anti-lavado", agents: 2, status: "ok", color: "#22c55e" },
  { name: "Regulatorio", desc: "Cumplimiento normativo", agents: 1, status: "ok", color: "#3b82f6" },
  { name: "Riesgo Operacional", desc: "Evaluación de riesgos", agents: 1, status: "warning", color: "#f59e0b" },
  { name: "Auditoría Interna", desc: "Controles internos", agents: 1, status: "ok", color: "#8b5cf6" },
];

export default function CompliancePage() {
  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/">
        <StatusBadge status="active" label="Compliance Core" size="lg" />
      </NavigationBar>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
            <Shield className="w-10 h-10 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Compliance & Risk
            </h1>
            <p className="text-gray-400 mt-1">5 agentes de IA para cumplimiento regulatorio</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard value="5" label="Agentes" icon={<Bot className="w-6 h-6 text-emerald-400" />} color="#10b981" />
        <StatCard value="98%" label="Cumplimiento" icon={<CheckCircle className="w-6 h-6 text-green-400" />} color="#22c55e" />
        <StatCard value="24/7" label="Monitoreo" icon={<Eye className="w-6 h-6 text-blue-400" />} color="#3b82f6" />
        <StatCard value="0" label="Alertas Críticas" icon={<AlertTriangle className="w-6 h-6 text-yellow-400" />} color="#f59e0b" />
      </div>

      <h2 className="text-xl font-bold text-white mb-4">Áreas de Compliance</h2>
      <div className="grid grid-cols-2 gap-6">
        {COMPLIANCE_AREAS.map((area, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <GlassCard className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl" style={{ backgroundColor: area.color + "20" }}>
                  <Shield className="w-6 h-6" style={{ color: area.color }} />
                </div>
                <StatusBadge status={area.status === "ok" ? "active" : "warning"} label={area.status === "ok" ? "OK" : "Revisar"} size="sm" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{area.name}</h3>
              <p className="text-sm text-gray-400 mb-4">{area.desc}</p>
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <span className="text-xs text-gray-500">{area.agents} agentes activos</span>
                <button className="text-xs text-emerald-400 hover:text-emerald-300">Ver detalles →</button>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

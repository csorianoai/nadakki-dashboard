"use client";
import { motion } from "framer-motion";
import { 
  Brain, Zap, Target, BarChart3,
  Bot, CheckCircle, Clock, TrendingUp
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

const DECISION_AGENTS = [
  { name: "Credit Decision Engine", desc: "Motor de decisión crediticia", status: "active" },
  { name: "Risk Scorer", desc: "Scoring de riesgo en tiempo real", status: "active" },
  { name: "Fraud Predictor", desc: "Predicción de fraude", status: "active" },
  { name: "Approval Optimizer", desc: "Optimización de aprobaciones", status: "active" },
  { name: "Limit Calculator", desc: "Cálculo de límites de crédito", status: "active" },
];

export default function DecisionPage() {
  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/">
        <StatusBadge status="active" label="Decision Core" size="lg" />
      </NavigationBar>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
            <Brain className="w-10 h-10 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Decision Engine
            </h1>
            <p className="text-gray-400 mt-1">5 agentes de IA para decisiones automatizadas</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard value="5" label="Agentes" icon={<Bot className="w-6 h-6 text-cyan-400" />} color="#06b6d4" />
        <StatCard value="< 100ms" label="Latencia" icon={<Zap className="w-6 h-6 text-yellow-400" />} color="#f59e0b" />
        <StatCard value="99.9%" label="Uptime" icon={<CheckCircle className="w-6 h-6 text-green-400" />} color="#22c55e" />
        <StatCard value="50K+" label="Decisiones/día" icon={<TrendingUp className="w-6 h-6 text-purple-400" />} color="#8b5cf6" />
      </div>

      <h2 className="text-xl font-bold text-white mb-4">Agentes de Decisión</h2>
      <div className="space-y-4">
        {DECISION_AGENTS.map((agent, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
            <GlassCard className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                    <Brain className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{agent.name}</h3>
                    <p className="text-sm text-gray-400">{agent.desc}</p>
                  </div>
                </div>
                <StatusBadge status="active" size="sm" />
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

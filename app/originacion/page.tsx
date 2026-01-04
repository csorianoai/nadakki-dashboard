"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Banknote, Users, FileCheck, TrendingUp,
  Bot, Play, CheckCircle, Clock
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

const AGENTS = [
  { id: "creditanalyzeria", name: "Credit Analyzer IA", status: "active" },
  { id: "riskassessoria", name: "Risk Assessor IA", status: "active" },
  { id: "documentverifieria", name: "Document Verifier IA", status: "active" },
  { id: "incomevalidatoria", name: "Income Validator IA", status: "active" },
  { id: "frauddetectoria", name: "Fraud Detector IA", status: "active" },
  { id: "scoringmodeleria", name: "Scoring Model IA", status: "active" },
  { id: "applicationprocessoria", name: "Application Processor IA", status: "active" },
  { id: "collateralvaluatoria", name: "Collateral Valuator IA", status: "active" },
  { id: "loanstructureria", name: "Loan Structurer IA", status: "active" },
  { id: "approvalrecommenderia", name: "Approval Recommender IA", status: "active" },
];

export default function OriginacionPage() {
  const [executing, setExecuting] = useState<string | null>(null);

  const executeAgent = async (agentId: string) => {
    setExecuting(agentId);
    try {
      await fetch("https://nadakki-ai-suite.onrender.com/agents/originacion/" + agentId + "/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input_data: { test: true }, tenant_id: "credicefi" })
      });
    } finally {
      setTimeout(() => setExecuting(null), 1500);
    }
  };

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/">
        <StatusBadge status="active" label="Originación Core" size="lg" />
      </NavigationBar>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
            <Banknote className="w-10 h-10 text-green-400" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              Originación de Crédito
            </h1>
            <p className="text-gray-400 mt-1">10 agentes de IA para procesamiento de solicitudes</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard value="10" label="Agentes" icon={<Bot className="w-6 h-6 text-green-400" />} color="#22c55e" />
        <StatCard value="1,234" label="Solicitudes/día" icon={<FileCheck className="w-6 h-6 text-blue-400" />} color="#3b82f6" />
        <StatCard value="97.8%" label="Precisión" icon={<CheckCircle className="w-6 h-6 text-purple-400" />} color="#8b5cf6" />
        <StatCard value="< 30s" label="Tiempo Decisión" icon={<Clock className="w-6 h-6 text-yellow-400" />} color="#f59e0b" />
      </div>

      <h2 className="text-xl font-bold text-white mb-4">Agentes de Originación</h2>
      <div className="grid grid-cols-2 gap-4">
        {AGENTS.map((agent, i) => (
          <motion.div key={agent.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <GlassCard className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                    <Bot className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{agent.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-xs text-gray-400">Activo</span>
                    </div>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => executeAgent(agent.id)}
                  disabled={executing === agent.id}
                  className={`p-3 rounded-xl transition-colors ${executing === agent.id ? "bg-green-500/20" : "bg-white/5 hover:bg-green-500/20"}`}
                >
                  {executing === agent.id ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <Play className="w-5 h-5 text-gray-400 hover:text-green-400" />
                  )}
                </motion.button>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

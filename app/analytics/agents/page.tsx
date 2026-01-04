"use client";
import { motion } from "framer-motion";
import { Bot, TrendingUp, Zap } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";

const AGENTS = [
  { name: "Analytics Reporter IA", executions: 1234, accuracy: "98.5%" },
  { name: "Trend Detector IA", executions: 567, accuracy: "96.2%" },
  { name: "ROI Calculator IA", executions: 890, accuracy: "99.1%" },
  { name: "Anomaly Detector IA", executions: 234, accuracy: "97.8%" },
];

export default function AnalyticsAgentsPage() {
  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/analytics"><StatusBadge status="active" label="4 Agentes" size="lg" /></NavigationBar>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-cyan-500/20 border border-cyan-500/30"><Bot className="w-8 h-8 text-cyan-400" /></div>
          <div><h1 className="text-3xl font-bold text-white">Agentes de Analytics</h1><p className="text-gray-400">Agentes IA para analisis de datos</p></div>
        </div>
      </motion.div>
      <div className="grid grid-cols-2 gap-4">
        {AGENTS.map((a, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <GlassCard className="p-5">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-cyan-500/20"><Bot className="w-6 h-6 text-cyan-400" /></div>
                <div className="flex-1"><h3 className="font-bold text-white">{a.name}</h3><p className="text-sm text-gray-400">{a.executions} ejecuciones</p></div>
                <div className="text-right"><p className="text-lg font-bold text-green-400">{a.accuracy}</p><p className="text-xs text-gray-500">Precision</p></div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

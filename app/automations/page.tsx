"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Zap, Play, Pause, Settings, ArrowRight } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

const AUTOMATIONS = [
  { id: 1, name: "Welcome Sequence", status: "active", triggers: 234, executions: 1890 },
  { id: 2, name: "Abandono Carrito", status: "active", triggers: 567, executions: 3456 },
  { id: 3, name: "Re-engagement", status: "paused", triggers: 89, executions: 456 },
  { id: 4, name: "Birthday Email", status: "active", triggers: 45, executions: 234 },
];

export default function AutomationsPage() {
  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/"><StatusBadge status="active" label="Automations" size="lg" /></NavigationBar>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-yellow-500/20 border border-yellow-500/30"><Zap className="w-8 h-8 text-yellow-400" /></div>
          <div><h1 className="text-3xl font-bold text-white">Automatizaciones</h1><p className="text-gray-400">Workflows y secuencias automaticas</p></div>
        </div>
      </motion.div>
      <div className="grid grid-cols-3 gap-6 mb-8">
        <StatCard value="4" label="Automatizaciones" icon={<Zap className="w-6 h-6 text-yellow-400" />} color="#f59e0b" />
        <StatCard value="935" label="Triggers/mes" icon={<Play className="w-6 h-6 text-green-400" />} color="#22c55e" />
        <StatCard value="6K" label="Ejecuciones" icon={<Settings className="w-6 h-6 text-blue-400" />} color="#3b82f6" />
      </div>
      <div className="space-y-4">
        {AUTOMATIONS?.map((auto, i) => (
          <motion.div key={auto.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <GlassCard className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-yellow-500/20"><Zap className="w-5 h-5 text-yellow-400" /></div>
                  <div><h3 className="font-bold text-white">{auto.name}</h3><p className="text-sm text-gray-400">{auto.triggers} triggers - {auto.executions} ejecuciones</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={auto.status === "active" ? "active" : "warning"} label={auto.status === "active" ? "Activa" : "Pausada"} size="sm" />
                  <button className="p-2 hover:bg-white/10 rounded-lg">{auto.status === "active" ? <Pause className="w-4 h-4 text-gray-400" /> : <Play className="w-4 h-4 text-gray-400" />}</button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}


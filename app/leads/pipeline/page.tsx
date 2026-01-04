"use client";
import { motion } from "framer-motion";
import { Filter, Users } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";

const STAGES = [
  { name: "Nuevo", count: 45, value: "$125K", color: "#3b82f6" },
  { name: "Contactado", count: 32, value: "$89K", color: "#8b5cf6" },
  { name: "Calificado", count: 18, value: "$67K", color: "#f59e0b" },
  { name: "Propuesta", count: 12, value: "$45K", color: "#ec4899" },
  { name: "Negociacion", count: 8, value: "$32K", color: "#22c55e" },
];

export default function LeadsPipelinePage() {
  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/leads"><StatusBadge status="active" label="Pipeline" size="lg" /></NavigationBar>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-500/20 border border-blue-500/30"><Filter className="w-8 h-8 text-blue-400" /></div>
          <div><h1 className="text-3xl font-bold text-white">Pipeline de Ventas</h1><p className="text-gray-400">Visualiza tu embudo de conversion</p></div>
        </div>
      </motion.div>
      <div className="grid grid-cols-5 gap-4">
        {STAGES.map((stage, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <GlassCard className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white">{stage.name}</h3>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
              </div>
              <p className="text-3xl font-bold" style={{ color: stage.color }}>{stage.count}</p>
              <p className="text-sm text-gray-400">{stage.value}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

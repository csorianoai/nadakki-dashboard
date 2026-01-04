"use client";
import { motion } from "framer-motion";
import { Play, Eye, Pause, BarChart3 } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";

const ACTIVE = [
  { name: "Black Friday 2024", channel: "Multi-channel", budget: "$5,000", spent: "$3,200", roi: "245%" },
  { name: "Newsletter Enero", channel: "Email", budget: "$500", spent: "$450", roi: "180%" },
  { name: "Social Q1", channel: "Social Media", budget: "$2,000", spent: "$1,100", roi: "156%" },
];

export default function CampaignsActivePage() {
  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/campaigns"><StatusBadge status="active" label="3 Activas" size="lg" /></NavigationBar>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-green-500/20 border border-green-500/30"><Play className="w-8 h-8 text-green-400" /></div>
          <div><h1 className="text-3xl font-bold text-white">Campanas Activas</h1><p className="text-gray-400">Campanas en ejecucion</p></div>
        </div>
      </motion.div>
      <div className="space-y-4">
        {ACTIVE.map((c, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div><h3 className="font-bold text-white">{c.name}</h3><p className="text-sm text-gray-400">{c.channel}</p></div>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-white/10 rounded-lg"><Eye className="w-4 h-4 text-gray-400" /></button>
                  <button className="p-2 hover:bg-white/10 rounded-lg"><BarChart3 className="w-4 h-4 text-gray-400" /></button>
                  <button className="p-2 hover:bg-yellow-500/20 rounded-lg"><Pause className="w-4 h-4 text-yellow-400" /></button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-white/5 rounded-lg"><p className="text-lg font-bold text-white">{c.budget}</p><p className="text-xs text-gray-500">Presupuesto</p></div>
                <div className="p-3 bg-white/5 rounded-lg"><p className="text-lg font-bold text-blue-400">{c.spent}</p><p className="text-xs text-gray-500">Gastado</p></div>
                <div className="p-3 bg-white/5 rounded-lg"><p className="text-lg font-bold text-green-400">{c.roi}</p><p className="text-xs text-gray-500">ROI</p></div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

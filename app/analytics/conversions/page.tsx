"use client";
import { motion } from "framer-motion";
import { Target, TrendingUp } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

export default function AnalyticsConversionsPage() {
  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/analytics"><StatusBadge status="active" label="Conversions" size="lg" /></NavigationBar>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-green-500/20 border border-green-500/30"><Target className="w-8 h-8 text-green-400" /></div>
          <div><h1 className="text-3xl font-bold text-white">Conversion Analytics</h1><p className="text-gray-400">Analisis de conversiones y embudos</p></div>
        </div>
      </motion.div>
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard value="12.5K" label="Conversiones" icon={<Target className="w-6 h-6 text-green-400" />} color="#22c55e" />
        <StatCard value="3.8%" label="Tasa Conversion" icon={<TrendingUp className="w-6 h-6 text-blue-400" />} color="#3b82f6" />
        <StatCard value="$45" label="CPA Promedio" icon={<Target className="w-6 h-6 text-yellow-400" />} color="#f59e0b" />
        <StatCard value="+15%" label="vs Mes Anterior" icon={<TrendingUp className="w-6 h-6 text-purple-400" />} color="#8b5cf6" />
      </div>
      <GlassCard className="p-6"><p className="text-gray-400">Funnel de conversion en desarrollo...</p></GlassCard>
    </div>
  );
}

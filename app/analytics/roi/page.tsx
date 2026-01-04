"use client";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, PieChart } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

export default function AnalyticsRoiPage() {
  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/analytics"><StatusBadge status="active" label="ROI Analysis" size="lg" /></NavigationBar>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-green-500/20 border border-green-500/30"><DollarSign className="w-8 h-8 text-green-400" /></div>
          <div><h1 className="text-3xl font-bold text-white">ROI Analysis</h1><p className="text-gray-400">Retorno de inversion por canal</p></div>
        </div>
      </motion.div>
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard value="$125K" label="Revenue Total" icon={<DollarSign className="w-6 h-6 text-green-400" />} color="#22c55e" />
        <StatCard value="$32K" label="Inversion" icon={<PieChart className="w-6 h-6 text-blue-400" />} color="#3b82f6" />
        <StatCard value="290%" label="ROI Global" icon={<TrendingUp className="w-6 h-6 text-purple-400" />} color="#8b5cf6" />
        <StatCard value="+45%" label="vs Q3" icon={<TrendingUp className="w-6 h-6 text-yellow-400" />} color="#f59e0b" />
      </div>
      <GlassCard className="p-6"><p className="text-gray-400">Desglose de ROI por canal en desarrollo...</p></GlassCard>
    </div>
  );
}

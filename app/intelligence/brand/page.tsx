"use client";
import { motion } from "framer-motion";
import { Building2, TrendingUp, MessageSquare, Heart } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

export default function IntelligenceBrandPage() {
  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/intelligence"><StatusBadge status="active" label="Brand Intel" size="lg" /></NavigationBar>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/30"><Building2 className="w-8 h-8 text-purple-400" /></div>
          <div><h1 className="text-3xl font-bold text-white">Brand Intelligence</h1><p className="text-gray-400">Monitoreo y analisis de tu marca</p></div>
        </div>
      </motion.div>
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard value="89%" label="Sentiment Positivo" icon={<Heart className="w-6 h-6 text-green-400" />} color="#22c55e" />
        <StatCard value="12.5K" label="Menciones/mes" icon={<MessageSquare className="w-6 h-6 text-blue-400" />} color="#3b82f6" />
        <StatCard value="+15%" label="Brand Awareness" icon={<TrendingUp className="w-6 h-6 text-purple-400" />} color="#8b5cf6" />
        <StatCard value="4.8" label="Rating Promedio" icon={<Heart className="w-6 h-6 text-yellow-400" />} color="#f59e0b" />
      </div>
      <GlassCard className="p-6"><p className="text-gray-400">Dashboard de brand intelligence en desarrollo...</p></GlassCard>
    </div>
  );
}

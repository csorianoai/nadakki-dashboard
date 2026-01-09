"use client";
import { motion } from "framer-motion";
import { Eye, TrendingUp, AlertTriangle, Hash } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

const KEYWORDS = [
  { keyword: "#credicefi", mentions: 234, sentiment: "positive", trend: "+15%" },
  { keyword: "fintech mexico", mentions: 89, sentiment: "neutral", trend: "+5%" },
  { keyword: "credito digital", mentions: 156, sentiment: "positive", trend: "+22%" },
];

export default function SocialMonitoringPage() {
  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/social"><StatusBadge status="active" label="Monitoring" size="lg" /></NavigationBar>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/30"><Eye className="w-8 h-8 text-purple-400" /></div>
          <div><h1 className="text-3xl font-bold text-white">Social Monitoring</h1><p className="text-gray-400">Monitoreo de menciones y keywords</p></div>
        </div>
      </motion.div>
      <div className="grid grid-cols-3 gap-6 mb-8">
        <StatCard value="479" label="Menciones/dia" icon={<Hash className="w-6 h-6 text-purple-400" />} color="#8b5cf6" />
        <StatCard value="89%" label="Sentiment Positivo" icon={<TrendingUp className="w-6 h-6 text-green-400" />} color="#22c55e" />
        <StatCard value="3" label="Alertas" icon={<AlertTriangle className="w-6 h-6 text-yellow-400" />} color="#f59e0b" />
      </div>
      <h2 className="text-xl font-bold text-white mb-4">Keywords Monitoreados</h2>
      <div className="space-y-4">
        {KEYWORDS?.map((k, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <GlassCard className="p-5">
              <div className="flex items-center justify-between">
                <div><h3 className="font-bold text-white">{k.keyword}</h3><p className="text-sm text-gray-400">{k.mentions} menciones</p></div>
                <div className="flex items-center gap-4">
                  <StatusBadge status={k.sentiment === "positive" ? "active" : "warning"} label={k.sentiment} size="sm" />
                  <span className="text-green-400 font-medium">{k.trend}</span>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}


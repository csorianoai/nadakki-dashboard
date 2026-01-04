"use client";
import { motion } from "framer-motion";
import { Users, TrendingUp, TrendingDown } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";

const COMPETITORS = [
  { name: "Competitor A", share: "32%", trend: 5, social: "45K" },
  { name: "Competitor B", share: "28%", trend: -2, social: "38K" },
  { name: "Competitor C", share: "18%", trend: 8, social: "22K" },
  { name: "Tu Marca", share: "22%", trend: 12, social: "41K" },
];

export default function IntelligenceCompetitorsPage() {
  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/intelligence"><StatusBadge status="active" label="Competitors" size="lg" /></NavigationBar>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-pink-500/20 border border-pink-500/30"><Users className="w-8 h-8 text-pink-400" /></div>
          <div><h1 className="text-3xl font-bold text-white">Analisis Competitivo</h1><p className="text-gray-400">Comparacion con competidores</p></div>
        </div>
      </motion.div>
      <div className="space-y-4">
        {COMPETITORS.map((c, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <GlassCard className={`p-5 ${c.name === "Tu Marca" ? "border border-purple-500/50" : ""}`}>
              <div className="flex items-center justify-between">
                <div><h3 className={`font-bold ${c.name === "Tu Marca" ? "text-purple-400" : "text-white"}`}>{c.name}</h3></div>
                <div className="flex items-center gap-8">
                  <div className="text-center"><p className="text-xl font-bold text-white">{c.share}</p><p className="text-xs text-gray-500">Market Share</p></div>
                  <div className="text-center flex items-center gap-1">
                    {c.trend > 0 ? <TrendingUp className="w-4 h-4 text-green-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />}
                    <p className={`text-lg font-bold ${c.trend > 0 ? "text-green-400" : "text-red-400"}`}>{c.trend > 0 ? "+" : ""}{c.trend}%</p>
                  </div>
                  <div className="text-center"><p className="text-xl font-bold text-blue-400">{c.social}</p><p className="text-xs text-gray-500">Seguidores</p></div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

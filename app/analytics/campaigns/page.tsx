"use client";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, DollarSign } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

const CAMPAIGNS = [
  { name: "Black Friday", impressions: "1.2M", clicks: "45K", conversions: "2.3K", roi: "320%" },
  { name: "Newsletter Q4", impressions: "450K", clicks: "12K", conversions: "890", roi: "180%" },
  { name: "Social Ads", impressions: "890K", clicks: "34K", conversions: "1.5K", roi: "245%" },
];

export default function AnalyticsCampaignsPage() {
  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/analytics"><StatusBadge status="active" label="Campaign Analytics" size="lg" /></NavigationBar>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/30"><BarChart3 className="w-8 h-8 text-purple-400" /></div>
          <div><h1 className="text-3xl font-bold text-white">Analytics de Campanas</h1><p className="text-gray-400">Rendimiento detallado de campanas</p></div>
        </div>
      </motion.div>
      <div className="space-y-4">
        {CAMPAIGNS.map((c, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <GlassCard className="p-5">
              <h3 className="font-bold text-white mb-4">{c.name}</h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="p-3 bg-white/5 rounded-lg text-center"><p className="text-xl font-bold text-white">{c.impressions}</p><p className="text-xs text-gray-500">Impresiones</p></div>
                <div className="p-3 bg-white/5 rounded-lg text-center"><p className="text-xl font-bold text-blue-400">{c.clicks}</p><p className="text-xs text-gray-500">Clicks</p></div>
                <div className="p-3 bg-white/5 rounded-lg text-center"><p className="text-xl font-bold text-purple-400">{c.conversions}</p><p className="text-xs text-gray-500">Conversiones</p></div>
                <div className="p-3 bg-white/5 rounded-lg text-center"><p className="text-xl font-bold text-green-400">{c.roi}</p><p className="text-xs text-gray-500">ROI</p></div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

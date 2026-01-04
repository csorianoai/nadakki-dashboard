"use client";
import { motion } from "framer-motion";
import { 
  BarChart3, TrendingUp, TrendingDown, Users, 
  DollarSign, Target, Eye, MousePointer
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

const METRICS = [
  { label: "Impresiones", value: "1.2M", change: 15.3, positive: true, icon: Eye },
  { label: "Clicks", value: "45.2K", change: 8.7, positive: true, icon: MousePointer },
  { label: "CTR", value: "3.8%", change: -2.1, positive: false, icon: Target },
  { label: "Conversiones", value: "2,847", change: 22.5, positive: true, icon: Users },
];

const CAMPAIGNS = [
  { name: "Black Friday 2024", status: "active", impressions: "450K", clicks: "12.3K", ctr: "2.7%", conversions: 892 },
  { name: "Año Nuevo 2025", status: "active", impressions: "280K", clicks: "8.9K", ctr: "3.2%", conversions: 567 },
  { name: "Q4 Brand Awareness", status: "completed", impressions: "890K", clicks: "24.5K", ctr: "2.8%", conversions: 1234 },
  { name: "Webinar IA Marketing", status: "draft", impressions: "0", clicks: "0", ctr: "0%", conversions: 0 },
];

const CHANNELS = [
  { name: "Google Ads", value: 45, color: "#4285F4" },
  { name: "Meta Ads", value: 30, color: "#1877F2" },
  { name: "LinkedIn", value: 15, color: "#0A66C2" },
  { name: "Email", value: 10, color: "#22c55e" },
];

export default function MarketingAnalyticsPage() {
  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/marketing">
        <StatusBadge status="active" label="Real-time Analytics" size="lg" />
      </NavigationBar>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-yellow-500/20 border border-yellow-500/30">
            <BarChart3 className="w-8 h-8 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Marketing Analytics</h1>
            <p className="text-gray-400">Métricas de rendimiento y ROI de campañas</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        {METRICS.map((metric, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <metric.icon className="w-6 h-6 text-yellow-400" />
                <div className={`flex items-center gap-1 text-sm ${metric.positive ? "text-green-400" : "text-red-400"}`}>
                  {metric.positive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {Math.abs(metric.change)}%
                </div>
              </div>
              <p className="text-3xl font-bold text-white">{metric.value}</p>
              <p className="text-sm text-gray-400">{metric.label}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="col-span-2">
          <h2 className="text-xl font-bold text-white mb-4">Campañas Activas</h2>
          <GlassCard className="overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Campaña</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Estado</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Impresiones</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">CTR</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Conversiones</th>
                </tr>
              </thead>
              <tbody>
                {CAMPAIGNS.map((campaign, i) => (
                  <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 + i * 0.05 }}
                    className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-6 py-4 font-medium text-white">{campaign.name}</td>
                    <td className="px-6 py-4">
                      <StatusBadge 
                        status={campaign.status === "active" ? "active" : campaign.status === "completed" ? "inactive" : "warning"} 
                        label={campaign.status === "active" ? "Activa" : campaign.status === "completed" ? "Completada" : "Borrador"} 
                        size="sm" 
                      />
                    </td>
                    <td className="px-6 py-4 text-gray-300">{campaign.impressions}</td>
                    <td className="px-6 py-4 text-gray-300">{campaign.ctr}</td>
                    <td className="px-6 py-4 text-green-400 font-medium">{campaign.conversions.toLocaleString()}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </GlassCard>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white mb-4">Por Canal</h2>
          <GlassCard className="p-6">
            <div className="space-y-4">
              {CHANNELS.map((channel, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-300">{channel.name}</span>
                    <span className="text-sm font-bold text-white">{channel.value}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: channel.value + "%" }} transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                      className="h-full rounded-full" style={{ backgroundColor: channel.color }} />
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

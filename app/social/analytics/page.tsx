"use client";
import { motion } from "framer-motion";
import { BarChart3, Users, Heart, MessageSquare, Eye, ArrowUpRight } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";

const METRICS = [
  { label: "Seguidores Totales", value: "41.2K", change: 5.2, icon: Users },
  { label: "Engagement Rate", value: "4.8%", change: 0.8, icon: Heart },
  { label: "Alcance Mensual", value: "125K", change: 12.3, icon: Eye },
  { label: "Interacciones", value: "8.5K", change: -2.1, icon: MessageSquare },
];

const PLATFORM_STATS = [
  { platform: "Instagram", followers: "12.5K", engagement: "5.2%", posts: 45, color: "#E1306C" },
  { platform: "Twitter", followers: "8.2K", engagement: "3.8%", posts: 89, color: "#1DA1F2" },
  { platform: "LinkedIn", followers: "5.1K", engagement: "6.1%", posts: 23, color: "#0A66C2" },
  { platform: "Facebook", followers: "15.4K", engagement: "2.4%", posts: 34, color: "#1877F2" },
];

export default function SocialAnalyticsPage() {
  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/social">
        <StatusBadge status="active" label="Actualizado hace 5 min" size="lg" />
      </NavigationBar>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-yellow-500/20 border border-yellow-500/30">
            <BarChart3 className="w-8 h-8 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Social Analytics</h1>
            <p className="text-gray-400">Metricas de rendimiento en redes sociales</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        {METRICS?.map((metric, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <metric.icon className="w-6 h-6 text-yellow-400" />
                <div className={`flex items-center gap-1 text-sm ${metric.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                  <ArrowUpRight className={`w-4 h-4 ${metric.change < 0 ? "rotate-180" : ""}`} />
                  {Math.abs(metric.change)}%
                </div>
              </div>
              <p className="text-3xl font-bold text-white">{metric.value}</p>
              <p className="text-sm text-gray-400">{metric.label}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <h2 className="text-xl font-bold text-white mb-4">Rendimiento por Plataforma</h2>
      <div className="grid grid-cols-2 gap-6">
        {PLATFORM_STATS?.map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }}>
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">{stat.platform}</h3>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stat.color }} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><p className="text-2xl font-bold text-white">{stat.followers}</p><p className="text-xs text-gray-500">Seguidores</p></div>
                <div><p className="text-2xl font-bold text-green-400">{stat.engagement}</p><p className="text-xs text-gray-500">Engagement</p></div>
                <div><p className="text-2xl font-bold text-blue-400">{stat.posts}</p><p className="text-xs text-gray-500">Posts/mes</p></div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}


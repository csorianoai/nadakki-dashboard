"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  BarChart3, TrendingUp, Users, Target, 
  ArrowUpRight, ArrowDownRight, Activity
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

const METRICS = [
  { label: "Ejecuciones Totales", value: "45,892", change: 12.5, positive: true },
  { label: "Tasa de Éxito", value: "98.7%", change: 2.1, positive: true },
  { label: "Tiempo Promedio", value: "245ms", change: -8.3, positive: true },
  { label: "Errores", value: "127", change: 15.2, positive: false },
];

const TOP_AGENTS = [
  { name: "LeadScoringIA", executions: 12450, success: 99.2 },
  { name: "ContentGeneratorIA", executions: 8920, success: 97.8 },
  { name: "SentimentAnalyzerIA", executions: 7650, success: 98.5 },
  { name: "EmailSequenceMaster", executions: 5430, success: 96.1 },
  { name: "CampaignOptimizerIA", executions: 4280, success: 99.0 },
];

const WEEKLY_DATA = [
  { day: "Lun", value: 65 },
  { day: "Mar", value: 78 },
  { day: "Mie", value: 82 },
  { day: "Jue", value: 71 },
  { day: "Vie", value: 90 },
  { day: "Sab", value: 45 },
  { day: "Dom", value: 38 },
];

export default function AnalyticsPage() {
  const maxValue = Math.max(...WEEKLY_DATA.map(d => d.value));

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/">
        <StatusBadge status="active" label="Real-time" size="lg" />
      </NavigationBar>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
            <BarChart3 className="w-8 h-8 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
            <p className="text-gray-400">Métricas y rendimiento de los agentes IA</p>
          </div>
        </div>
      </motion.div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {METRICS.map((metric, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <GlassCard className="p-6">
              <p className="text-sm text-gray-400 mb-2">{metric.label}</p>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold text-white">{metric.value}</p>
                <div className={`flex items-center gap-1 text-sm ${metric.positive ? "text-green-400" : "text-red-400"}`}>
                  {metric.positive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {Math.abs(metric.change)}%
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* Chart */}
        <div className="col-span-2">
          <GlassCard className="p-6 h-full">
            <h3 className="text-lg font-bold text-white mb-6">Ejecuciones por Día</h3>
            <div className="flex items-end justify-between h-48 gap-4">
              {WEEKLY_DATA.map((data, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${(data.value / maxValue) * 100}%` }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                  className="flex-1 flex flex-col items-center gap-2"
                >
                  <div 
                    className="w-full bg-gradient-to-t from-cyan-500 to-purple-500 rounded-t-lg relative group cursor-pointer"
                    style={{ height: "100%" }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-white/10 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      {data.value}%
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{data.day}</span>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Top Agents */}
        <div>
          <GlassCard className="p-6 h-full">
            <h3 className="text-lg font-bold text-white mb-4">Top Agentes</h3>
            <div className="space-y-4">
              {TOP_AGENTS.map((agent, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <span className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center text-xs font-bold text-cyan-400">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{agent.name}</p>
                    <p className="text-xs text-gray-500">{agent.executions.toLocaleString()} exec</p>
                  </div>
                  <span className="text-sm text-green-400">{agent.success}%</span>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Ver Logs Detallados", href: "/admin/logs", icon: Activity },
          { label: "Gestionar Agentes", href: "/admin/agents", icon: Users },
          { label: "Configurar Alertas", href: "/settings", icon: Target },
        ].map((link, i) => (
          <Link key={i} href={link.href}>
            <GlassCard className="p-4 cursor-pointer group">
              <div className="flex items-center gap-3">
                <link.icon className="w-5 h-5 text-gray-400 group-hover:text-cyan-400" />
                <span className="text-sm text-gray-300 group-hover:text-white">{link.label}</span>
              </div>
            </GlassCard>
          </Link>
        ))}
      </div>
    </div>
  );
}

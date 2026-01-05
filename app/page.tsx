"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  Cpu, Bot, Workflow, TrendingUp, Zap, Activity,
  ArrowUpRight, Clock, CheckCircle, AlertCircle
} from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { CORES_CONFIG } from "@/config/cores";

const STATS = [
  { value: "225", label: "Agentes IA", icon: <Bot className="w-6 h-6 text-purple-400" />, color: "#8b5cf6", trend: { value: 12, isPositive: true } },
  { value: "20", label: "AI Cores", icon: <Cpu className="w-6 h-6 text-cyan-400" />, color: "#06b6d4" },
  { value: "10", label: "Workflows", icon: <Workflow className="w-6 h-6 text-green-400" />, color: "#22c55e" },
  { value: "99.7%", label: "Uptime", icon: <Activity className="w-6 h-6 text-yellow-400" />, color: "#f59e0b" },
];

const RECENT_ACTIVITY = [
  { agent: "LeadScoringIA", action: "Procesó 150 leads", time: "Hace 2 min", status: "success" },
  { agent: "ContentGeneratorIA", action: "Generó 5 posts", time: "Hace 8 min", status: "success" },
  { agent: "SentimentAnalyzerIA", action: "Analizó 500 menciones", time: "Hace 15 min", status: "success" },
  { agent: "EmailSequenceMaster", action: "Error de conexión SMTP", time: "Hace 22 min", status: "error" },
];

export default function HomePage() {
  const coresArray = Object.entries(CORES_CONFIG).slice(0, 6);

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)]">
      <Sidebar />
      <main className="flex-1 ml-80">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-40 px-8 py-6 bg-[var(--bg-primary)]/80 backdrop-blur-xl border-b border-[var(--border-primary)]"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
                Global Dashboard
              </h1>
              <p className="text-[var(--text-secondary)] mt-1">NADAKKI AI Suite • Enterprise Multi-Tenant Platform</p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status="active" label="Sistema Operativo" size="lg" />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl font-bold text-white shadow-lg shadow-purple-500/25"
              >
                <Zap className="w-4 h-4 inline mr-2" />
                Ejecutar
              </motion.button>
            </div>
          </div>
        </motion.header>

        <div className="p-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            {STATS.map((stat, i) => (
              <StatCard key={i} {...stat} delay={i * 0.1} />
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            {/* AI Cores Section */}
            <div className="col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">AI Cores Disponibles</h2>
                <Link href="/admin" className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1">
                  Ver todos <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {coresArray.map(([id, core], index) => (
                  <motion.div
                    key={id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                  >
                    <Link href={"/" + id}>
                      <GlassCard className="p-5 cursor-pointer group">
                        <div className="flex items-start gap-4">
                          <div 
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                            style={{ backgroundColor: core.color + "20" }}
                          >
                            {core.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-white truncate group-hover:text-purple-400 transition-colors">
                              {core.displayName}
                            </h3>
                            <p className="text-sm text-[var(--text-secondary)] truncate">{core.description}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-[var(--text-secondary)]">
                                {core.agentCount} agentes
                              </span>
                              <StatusBadge status="active" size="sm" />
                            </div>
                          </div>
                        </div>
                      </GlassCard>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Activity Feed */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Actividad Reciente</h2>
                <Link href="/admin/logs" className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1">
                  Ver logs <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
              <GlassCard className="p-4">
                <div className="space-y-4">
                  {RECENT_ACTIVITY.map((activity, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="flex items-start gap-3 pb-4 border-b border-white/5 last:border-0 last:pb-0"
                    >
                      <div className={`p-2 rounded-lg ${activity.status === "success" ? "bg-green-500/10" : "bg-red-500/10"}`}>
                        {activity.status === "success" ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{activity.agent}</p>
                        <p className="text-xs text-[var(--text-secondary)] truncate">{activity.action}</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {activity.time}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </GlassCard>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Marketing Hub", href: "/marketing", icon: "🎯", color: "#f97316" },
              { label: "Workflows", href: "/workflows", icon: "🔄", color: "#8b5cf6" },
              { label: "AI Studio", href: "/ai-studio", icon: "✨", color: "#06b6d4" },
              { label: "Administración", href: "/admin", icon: "⚙️", color: "#64748b" },
            ].map((action, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
              >
                <Link href={action.href}>
                  <GlassCard className="p-4 cursor-pointer text-center group">
                    <span className="text-3xl mb-2 block">{action.icon}</span>
                    <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                      {action.label}
                    </span>
                  </GlassCard>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}


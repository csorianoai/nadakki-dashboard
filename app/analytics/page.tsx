"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BarChart3, Bot, DollarSign, FileText, Target, TrendingUp } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

const ANALYTICS_MODULES = [
  { id: "marketing-analytics", name: "Marketing Analytics", desc: "Vista consolidada de marketing y rendimiento", href: "/marketing/analytics", icon: TrendingUp, color: "#22c55e", badge: "CANONICAL" },
  { id: "campaigns", name: "Campaign Analytics", desc: "Rendimiento detallado por campana", href: "/analytics/campaigns", icon: BarChart3, color: "#8b5cf6" },
  { id: "agents", name: "Analytics Agents", desc: "Agentes IA y actividad analitica", href: "/analytics/agents", icon: Bot, color: "#06b6d4" },
  { id: "conversions", name: "Conversions", desc: "Embudo y conversiones por canal", href: "/analytics/conversions", icon: Target, color: "#f59e0b", badge: "PREVIEW" },
  { id: "reports", name: "Reports", desc: "Reportes del workspace de analytics", href: "/analytics/reports", icon: FileText, color: "#3b82f6" },
  { id: "roi", name: "ROI Analysis", desc: "Retorno por canal y comparativos", href: "/analytics/roi", icon: DollarSign, color: "#10b981", badge: "PREVIEW" },
];

export default function AnalyticsPage() {
  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/">
        <StatusBadge status="active" label="Analytics Hub" size="lg" />
      </NavigationBar>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
            <BarChart3 className="w-8 h-8 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Analytics Hub</h1>
            <p className="text-gray-400">Consolida el acceso a analytics, ROI, reportes y vistas de marketing.</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard value="6" label="Vistas Disponibles" icon={<BarChart3 className="w-6 h-6 text-cyan-400" />} color="#06b6d4" />
        <StatCard value="1" label="Vista Canonical" icon={<TrendingUp className="w-6 h-6 text-green-400" />} color="#22c55e" />
        <StatCard value="2" label="Previews" icon={<Target className="w-6 h-6 text-yellow-400" />} color="#f59e0b" />
        <StatCard value="1" label="Workspace Root" icon={<FileText className="w-6 h-6 text-blue-400" />} color="#3b82f6" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {ANALYTICS_MODULES.map((module, index) => (
          <motion.div
            key={module.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link href={module.href}>
              <GlassCard className="p-6 cursor-pointer group h-full hover:bg-white/10 transition-all">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: `${module.color}20` }}>
                    <module.icon className="w-6 h-6" style={{ color: module.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">
                        {module.name}
                      </h3>
                      {module.badge && (
                        <span className="text-[10px] px-2 py-1 rounded-full bg-white/10 text-gray-300">
                          {module.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">{module.desc}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                </div>
              </GlassCard>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

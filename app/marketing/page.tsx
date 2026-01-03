"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  Target, Users, FileText, Share2, BarChart3, Mail,
  TrendingUp, Zap, Play, ArrowRight, Search, Filter
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const MARKETING_SECTIONS = [
  { id: "leads", name: "Lead Management", icon: Target, desc: "Scoring, calificación y nurturing", agents: 3, color: "#22c55e", href: "/marketing/leads" },
  { id: "content", name: "Content Generation", icon: FileText, desc: "Generación de contenido con IA", agents: 4, color: "#8b5cf6", href: "/marketing/content" },
  { id: "social", name: "Social Media", icon: Share2, desc: "Gestión de redes sociales", agents: 4, color: "#3b82f6", href: "/marketing/social" },
  { id: "analytics", name: "Analytics", icon: BarChart3, desc: "Análisis y métricas", agents: 4, color: "#f59e0b", href: "/marketing/analytics" },
  { id: "campaigns", name: "Campaigns", icon: Mail, desc: "Automatización de campañas", agents: 5, color: "#ec4899", href: "/marketing/campaigns" },
  { id: "agents", name: "Todos los Agentes", icon: Users, desc: "Ver los 35 agentes", agents: 35, color: "#06b6d4", href: "/marketing/agents" },
];

const STATS = [
  { value: "35", label: "Agentes Activos", icon: <Users className="w-6 h-6 text-purple-400" />, color: "#8b5cf6" },
  { value: "6", label: "Categorías", icon: <Target className="w-6 h-6 text-green-400" />, color: "#22c55e" },
  { value: "98.5%", label: "Precisión", icon: <TrendingUp className="w-6 h-6 text-cyan-400" />, color: "#06b6d4" },
  { value: "45ms", label: "Latencia", icon: <Zap className="w-6 h-6 text-yellow-400" />, color: "#f59e0b" },
];

const TOP_AGENTS = [
  { id: "leadscoringia", name: "Lead Scoring IA", executions: 1250, accuracy: 94.2 },
  { id: "contentgeneratoria", name: "Content Generator", executions: 890, accuracy: 91.5 },
  { id: "sentimentanalyzeria", name: "Sentiment Analyzer", executions: 2100, accuracy: 96.8 },
  { id: "socialpostgeneratoria", name: "Social Post Generator", executions: 560, accuracy: 89.3 },
];

export default function MarketingHubPage() {
  const [apiStatus, setApiStatus] = useState<"checking" | "live" | "mock">("checking");

  useEffect(() => {
    fetch("https://nadakki-ai-suite.onrender.com/health", { method: "GET" })
      .then(() => setApiStatus("live"))
      .catch(() => setApiStatus("mock"));
  }, []);

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/">
        <div className="flex items-center gap-3">
          <StatusBadge 
            status={apiStatus === "live" ? "active" : apiStatus === "mock" ? "warning" : "loading"} 
            label={apiStatus === "live" ? "API Live" : apiStatus === "mock" ? "Demo Mode" : "Conectando..."} 
            size="lg" 
          />
        </div>
      </NavigationBar>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-4 mb-2">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/20 to-pink-500/20 border border-orange-500/30">
            <Target className="w-10 h-10 text-orange-400" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              Marketing Neural Suite
            </h1>
            <p className="text-gray-400 mt-1">35 agentes de IA para marketing automatizado • 6 categorías</p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {STATS.map((stat, i) => (
          <StatCard key={i} {...stat} delay={i * 0.1} />
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* Marketing Sections */}
        <div className="col-span-2">
          <h2 className="text-xl font-bold text-white mb-4">Módulos de Marketing</h2>
          <div className="grid grid-cols-2 gap-4">
            {MARKETING_SECTIONS.map((section, index) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
              >
                <Link href={section.href}>
                  <GlassCard className="p-5 cursor-pointer group h-full">
                    <div className="flex items-start gap-4">
                      <div 
                        className="p-3 rounded-xl shrink-0"
                        style={{ backgroundColor: section.color + "20" }}
                      >
                        <section.icon className="w-6 h-6" style={{ color: section.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white group-hover:text-orange-400 transition-colors">
                          {section.name}
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">{section.desc}</p>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-gray-400">
                            {section.agents} agentes
                          </span>
                          <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Top Agents */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Top Agentes</h2>
          <GlassCard className="p-4">
            <div className="space-y-4">
              {TOP_AGENTS.map((agent, i) => (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-3 pb-4 border-b border-white/5 last:border-0 last:pb-0"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500/20 to-pink-500/20 flex items-center justify-center text-sm font-bold text-orange-400">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{agent.name}</p>
                    <p className="text-xs text-gray-400">{agent.executions.toLocaleString()} ejecuciones</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-400">{agent.accuracy}%</p>
                    <p className="text-xs text-gray-500">precisión</p>
                  </div>
                </motion.div>
              ))}
            </div>
            <Link href="/marketing/agents">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full mt-4 py-3 bg-gradient-to-r from-orange-500/20 to-pink-500/20 border border-orange-500/30 rounded-xl text-orange-400 font-medium hover:bg-orange-500/30 transition-colors"
              >
                Ver todos los agentes
              </motion.button>
            </Link>
          </GlassCard>
        </div>
      </div>

      {/* Quick Execute */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Ejecución Rápida</h3>
            <p className="text-sm text-gray-400">Ejecuta workflows de marketing con un clic</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/workflows/campaign-optimization">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl font-bold text-white flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Campaign Optimization
              </motion.button>
            </Link>
            <Link href="/workflows/customer-acquisition-intelligence">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl font-medium text-white hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Customer Acquisition
              </motion.button>
            </Link>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

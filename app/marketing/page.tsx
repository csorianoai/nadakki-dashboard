"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  Megaphone, Bot, Target, BarChart3, FileText, Share2, Sparkles, ArrowRight,
  Wand2, Users, Split, Brain, TrendingUp, GitBranch, Layers, Database,
  Zap, Play
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

const API_URL = "https://nadakki-ai-suite.onrender.com";

const PHASE3_MODULES = [
  { id: "journeys", name: "Journey Builder", desc: "Canvas visual drag & drop", href: "/marketing/journeys", icon: GitBranch, color: "#8b5cf6", badge: "NUEVO", featured: true },
  { id: "templates", name: "Templates IA", desc: "Plantillas optimizadas por IA", href: "/marketing/templates", icon: Layers, color: "#ec4899", badge: "NUEVO", featured: true },
  { id: "integrations", name: "Integraciones", desc: "CDP/CRM Enterprise", href: "/marketing/integrations", icon: Database, color: "#3b82f6", badge: "NUEVO", featured: true },
  { id: "campaign-builder", name: "Campaign Builder", desc: "Crea campañas multicanal", href: "/marketing/campaigns", icon: Wand2, color: "#10b981", badge: "POPULAR" },
];

const PHASE2_MODULES = [
  { id: "segments", name: "Segmentación", desc: "Audiencias dinámicas", href: "/marketing/segments", icon: Users, color: "#22c55e" },
  { id: "ab-testing", name: "A/B Testing", desc: "Experimentos controlados", href: "/marketing/ab-testing", icon: Split, color: "#f59e0b" },
  { id: "predictive", name: "Métricas Predictivas", desc: "IA para decisiones", href: "/marketing/predictive", icon: Brain, color: "#8b5cf6" },
];

const OTHER_MODULES = [
  { id: "agents", name: "AI Agents", desc: "36 agentes de marketing", href: "/marketing/agents", icon: Bot, color: "#06b6d4" },
  { id: "campaigns", name: "Campañas", desc: "Campañas activas", href: "/marketing/campaigns", icon: Megaphone, color: "#ec4899" },
  { id: "content", name: "Contenido", desc: "Generación con IA", href: "/marketing/content", icon: FileText, color: "#f59e0b" },
  { id: "social", name: "Social Media", desc: "Gestión de redes", href: "/marketing/social", icon: Share2, color: "#3b82f6" },
  { id: "analytics", name: "Analytics", desc: "Métricas y reportes", href: "/marketing/analytics", icon: BarChart3, color: "#ef4444" },
];

export default function MarketingPage() {
  const [stats, setStats] = useState({ agents: 36, campaigns: 12, openRate: 35, clickRate: 12 });

  useEffect(() => {
    fetch(API_URL + "/api/campaigns/stats/summary?tenant_id=credicefi")
      .then(r => r.json())
      .then(d => setStats({ agents: 36, campaigns: d.summary?.total_campaigns || 12, openRate: d.summary?.open_rate || 35, clickRate: d.summary?.click_rate || 12 }))
      .catch(() => {});
  }, []);

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/">
        <StatusBadge status="active" label="Marketing Hub" size="lg" />
      </NavigationBar>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-blue-500/20 border border-pink-500/30">
            <Megaphone className="w-10 h-10 text-pink-400" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">Marketing Hub</h1>
            <p className="text-gray-400 mt-1">Automatización de marketing con IA - Visual Studio Edition</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard value={stats.agents.toString()} label="AI Agents" icon={<Bot className="w-6 h-6 text-cyan-400" />} color="#06b6d4" />
        <StatCard value={stats.campaigns.toString()} label="Campañas" icon={<Megaphone className="w-6 h-6 text-pink-400" />} color="#ec4899" />
        <StatCard value={stats.openRate + "%"} label="Open Rate" icon={<Target className="w-6 h-6 text-green-400" />} color="#22c55e" />
        <StatCard value={stats.clickRate + "%"} label="Click Rate" icon={<TrendingUp className="w-6 h-6 text-yellow-400" />} color="#f59e0b" />
      </div>

      {/* Phase 3 Featured */}
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Sparkles className="w-5 h-5 text-purple-400" /> Fase 3 - Visual Studio</h2>
      <div className="grid grid-cols-4 gap-4 mb-8">
        {PHASE3_MODULES.map((m, i) => (
          <motion.div key={m.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className={m.featured ? "col-span-1" : ""}>
            <Link href={m.href}>
              <GlassCard className={`p-5 cursor-pointer group h-full hover:border-purple-500/30 transition-all ${m.featured ? "border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent" : ""}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: m.color + "20" }}><m.icon className="w-6 h-6" style={{ color: m.color }} /></div>
                  {m.badge && <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${m.badge === "NUEVO" ? "bg-purple-500/20 text-purple-400" : "bg-green-500/20 text-green-400"}`}>{m.badge}</span>}
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">{m.name}</h3>
                <p className="text-sm text-gray-400 mt-1">{m.desc}</p>
                <div className="flex items-center justify-end mt-3 pt-3 border-t border-white/5"><ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" /></div>
              </GlassCard>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Phase 2 */}
      <h2 className="text-xl font-bold text-white mb-4">Fase 2 - Segmentación & Testing</h2>
      <div className="grid grid-cols-3 gap-6 mb-8">
        {PHASE2_MODULES.map((m, i) => (
          <motion.div key={m.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.05 }}>
            <Link href={m.href}>
              <GlassCard className="p-6 cursor-pointer group h-full hover:border-green-500/30 transition-all">
                <div className="p-3 rounded-xl mb-4 w-fit" style={{ backgroundColor: m.color + "20" }}><m.icon className="w-6 h-6" style={{ color: m.color }} /></div>
                <h3 className="text-lg font-bold text-white group-hover:text-green-400 transition-colors">{m.name}</h3>
                <p className="text-sm text-gray-400 mt-1">{m.desc}</p>
                <div className="flex items-center justify-end mt-4 pt-4 border-t border-white/5"><ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-green-400 group-hover:translate-x-1 transition-all" /></div>
              </GlassCard>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Other Modules */}
      <h2 className="text-xl font-bold text-white mb-4">Todos los Módulos</h2>
      <div className="grid grid-cols-5 gap-4">
        {OTHER_MODULES.map((m, i) => (
          <motion.div key={m.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 + i * 0.05 }}>
            <Link href={m.href}>
              <GlassCard className="p-4 cursor-pointer group h-full hover:border-pink-500/30 transition-all">
                <div className="p-2 rounded-lg mb-3 w-fit" style={{ backgroundColor: m.color + "20" }}><m.icon className="w-5 h-5" style={{ color: m.color }} /></div>
                <h3 className="text-sm font-bold text-white group-hover:text-pink-400 transition-colors">{m.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{m.desc}</p>
              </GlassCard>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-6 mt-8">
        <GlassCard className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-green-500/20"><Play className="w-5 h-5 text-green-400" /></div><div><div className="text-sm text-gray-400">Journeys Activos</div><div className="text-xl font-bold text-white">8</div></div></div></GlassCard>
        <GlassCard className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-500/20"><Database className="w-5 h-5 text-blue-400" /></div><div><div className="text-sm text-gray-400">Integraciones</div><div className="text-xl font-bold text-white">6/8</div></div></div></GlassCard>
        <GlassCard className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-purple-500/20"><Layers className="w-5 h-5 text-purple-400" /></div><div><div className="text-sm text-gray-400">Templates</div><div className="text-xl font-bold text-white">12</div></div></div></GlassCard>
      </div>
    </div>
  );
}


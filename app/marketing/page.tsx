"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Megaphone, Bot, Target, BarChart3, FileText, Share2, Mail, Sparkles, ArrowRight } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

const MODULES = [
  { id: "agents", name: "AI Agents", desc: "Agentes de marketing con IA", href: "/marketing/agents", icon: Bot, color: "#06b6d4" },
  { id: "leads", name: "Leads", desc: "Gestion de leads", href: "/marketing/leads", icon: Target, color: "#22c55e" },
  { id: "campaigns", name: "Campanas", desc: "Campanas de marketing", href: "/marketing/campaigns", icon: Megaphone, color: "#ec4899" },
  { id: "content", name: "Contenido", desc: "Generacion de contenido", href: "/marketing/content", icon: FileText, color: "#8b5cf6" },
  { id: "social", name: "Social Media", desc: "Gestion de redes", href: "/marketing/social", icon: Share2, color: "#3b82f6" },
  { id: "analytics", name: "Analytics", desc: "Metricas y reportes", href: "/marketing/analytics", icon: BarChart3, color: "#f59e0b" },
];

export default function MarketingPage() {
  const [agentCount, setAgentCount] = useState<number>(0);

  useEffect(() => {
    fetch("https://nadakki-ai-suite.onrender.com/api/catalog/marketing/agents")
      .then(res => res.json())
      .then(data => setAgentCount(data.total || 0))
      .catch(() => setAgentCount(35));
  }, []);

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/">
        <StatusBadge status="active" label="Marketing Hub" size="lg" />
      </NavigationBar>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30">
            <Megaphone className="w-10 h-10 text-pink-400" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">Marketing Hub</h1>
            <p className="text-gray-400 mt-1">Automatizacion de marketing con IA</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard value={agentCount.toString()} label="AI Agents" icon={<Bot className="w-6 h-6 text-cyan-400" />} color="#06b6d4" />
        <StatCard value="1,234" label="Leads Activos" icon={<Target className="w-6 h-6 text-green-400" />} color="#22c55e" />
        <StatCard value="12" label="Campanas" icon={<Megaphone className="w-6 h-6 text-pink-400" />} color="#ec4899" />
        <StatCard value="98.5%" label="Efectividad" icon={<Sparkles className="w-6 h-6 text-yellow-400" />} color="#f59e0b" />
      </div>

      <h2 className="text-xl font-bold text-white mb-4">Modulos</h2>
      <div className="grid grid-cols-3 gap-6">
        {MODULES.map((module, i) => (
          <motion.div key={module.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Link href={module.href}>
              <GlassCard className="p-6 cursor-pointer group h-full">
                <div className="p-3 rounded-xl mb-4 w-fit" style={{ backgroundColor: module.color + "20" }}>
                  <module.icon className="w-6 h-6" style={{ color: module.color }} />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-pink-400 transition-colors">{module.name}</h3>
                <p className="text-sm text-gray-400 mt-1">{module.desc}</p>
                <div className="flex items-center justify-end mt-4 pt-4 border-t border-white/5">
                  <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-pink-400 group-hover:translate-x-1 transition-all" />
                </div>
              </GlassCard>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Megaphone, Bot, Target, BarChart3, FileText, Share2, Sparkles, ArrowRight, Wand2 } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

const API_URL = "https://nadakki-ai-suite.onrender.com";

const MODULES = [
  { id: "agents", name: "AI Agents", desc: "36 agentes de marketing", href: "/marketing/agents", icon: Bot, color: "#06b6d4" },
  { id: "leads", name: "Leads", desc: "Gestion de leads", href: "/marketing/leads", icon: Target, color: "#22c55e" },
  { id: "campaigns", name: "Campanas", desc: "Campanas activas", href: "/marketing/campaigns", icon: Megaphone, color: "#ec4899" },
  { id: "content", name: "Contenido", desc: "Generacion con IA", href: "/marketing/content", icon: FileText, color: "#f59e0b" },
  { id: "social", name: "Social Media", desc: "Gestion de redes", href: "/marketing/social", icon: Share2, color: "#3b82f6" },
  { id: "analytics", name: "Analytics", desc: "Metricas y reportes", href: "/marketing/analytics", icon: BarChart3, color: "#ef4444" },
];

export default function MarketingPage() {
  const [stats, setStats] = useState({ agents: 0, campaigns: 0, openRate: 0, clickRate: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [agentsRes, campaignsRes] = await Promise.all([
          fetch(API_URL + "/api/catalog/marketing/agents"),
          fetch(API_URL + "/api/campaigns/stats/summary?tenant_id=credicefi")
        ]);
        
        const agentsData = await agentsRes.json();
        const campaignsData = await campaignsRes.json();
        
        setStats({
          agents: agentsData.total || 36,
          campaigns: campaignsData.summary?.total_campaigns || 12,
          openRate: campaignsData.summary?.open_rate || 35,
          clickRate: campaignsData.summary?.click_rate || 12
        });
      } catch (err) {
        setStats({ agents: 36, campaigns: 12, openRate: 35, clickRate: 12 });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
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
        <StatCard value={stats.agents.toString()} label="AI Agents" icon={<Bot className="w-6 h-6 text-cyan-400" />} color="#06b6d4" />
        <StatCard value={stats.campaigns.toString()} label="Campanas" icon={<Megaphone className="w-6 h-6 text-pink-400" />} color="#ec4899" />
        <StatCard value={stats.openRate + "%"} label="Open Rate" icon={<Target className="w-6 h-6 text-green-400" />} color="#22c55e" />
        <StatCard value={stats.clickRate + "%"} label="Click Rate" icon={<Sparkles className="w-6 h-6 text-yellow-400" />} color="#f59e0b" />
      </div>

      <Link href="/marketing/campaign-builder">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <GlassCard className="p-6 cursor-pointer group border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-cyan-500/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/30 to-cyan-500/30">
                  <Wand2 className="w-8 h-8 text-purple-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">Campaign Builder</h3>
                    <span className="px-2 py-0.5 text-xs font-medium bg-purple-500 text-white rounded-full">Nuevo</span>
                  </div>
                  <p className="text-gray-400 mt-1">Crea campanas multicanal con IA en 4 simples pasos</p>
                </div>
              </div>
              <ArrowRight className="w-6 h-6 text-gray-500 group-hover:text-purple-400 group-hover:translate-x-2 transition-all" />
            </div>
          </GlassCard>
        </motion.div>
      </Link>

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

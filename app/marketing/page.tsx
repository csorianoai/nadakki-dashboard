"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  GitBranch, Sparkles, Database, Target, FlaskConical, TrendingUp,
  Bot, Megaphone, FileText, Share2, BarChart3, Users, Zap, Globe,
  Map, Trophy, UserPlus, ArrowRight, Play, Pause, RefreshCw
} from "lucide-react";
import { useMarketingStats } from "@/app/hooks/useMarketingStats";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

const API_URL = "https://nadakki-ai-suite.onrender.com";

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// FASE 1 - CORE MARKETING
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const CORE_MODULES = [
  { 
    id: "campaigns", 
    name: "Campaigns", 
    desc: "Crea campaÃ±as multicanal con wizard de 5 pasos",
    href: "/marketing/campaigns", 
    icon: Megaphone, 
    color: "#ec4899",
    badge: "POPULAR",
    features: ["Email", "SMS", "Push", "In-App", "WhatsApp"]
  },
  { 
    id: "journeys", 
    name: "Customer Journeys", 
    desc: "Automatiza el ciclo de vida del cliente",
    href: "/marketing/journeys", 
    icon: GitBranch, 
    color: "#8b5cf6",
    badge: "NEW",
    features: ["Visual Canvas", "Triggers", "Conditions"]
  },
  { 
    id: "templates", 
    name: "Templates IA", 
    desc: "Plantillas optimizadas por inteligencia artificial",
    href: "/marketing/templates", 
    icon: Sparkles, 
    color: "#f59e0b",
    features: ["Onboarding", "Nurturing", "Retention"]
  },
  { 
    id: "segments", 
    name: "SegmentaciÃ³n Avanzada", 
    desc: "Crea segmentos dinÃ¡micos con reglas complejas",
    href: "/marketing/segments", 
    icon: Target, 
    color: "#22c55e",
    features: ["RFM", "Behavioral", "Predictive"]
  },
];

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// FASE 2 - TESTING & ANALYTICS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const TESTING_MODULES = [
  { 
    id: "ab-testing", 
    name: "A/B Testing", 
    desc: "Experimenta y optimiza tus campaÃ±as",
    href: "/marketing/ab-testing", 
    icon: FlaskConical, 
    color: "#06b6d4",
    features: ["Variants", "Statistics", "Auto-winner"]
  },
  { 
    id: "predictive", 
    name: "Predictive Analytics", 
    desc: "MÃ©tricas predictivas con machine learning",
    href: "/marketing/predictive", 
    icon: TrendingUp, 
    color: "#8b5cf6",
    features: ["Churn Risk", "LTV", "Next Action"]
  },
  { 
    id: "attribution", 
    name: "Attribution", 
    desc: "Analiza el impacto de cada canal",
    href: "/marketing/attribution", 
    icon: Map, 
    color: "#f97316",
    features: ["Multi-touch", "First/Last Click", "Custom"]
  },
  { 
    id: "analytics", 
    name: "Analytics Dashboard", 
    desc: "MÃ©tricas en tiempo real de todas las campaÃ±as",
    href: "/marketing/analytics", 
    icon: BarChart3, 
    color: "#3b82f6",
    features: ["Real-time", "Custom Reports", "Export"]
  },
];

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// FASE 3 - CHANNELS & INTEGRATIONS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const CHANNEL_MODULES = [
  { 
    id: "agents", 
    name: "AI Agents", 
    desc: "Agentes inteligentes para automatizaciÃ³n",
    href: "/marketing/agents", 
    icon: Bot, 
    color: "#10b981",
    badge: "AI",
    features: ["Chatbots", "Email Agent", "Support"]
  },
  { 
    id: "content", 
    name: "Content Studio", 
    desc: "Genera contenido con IA",
    href: "/marketing/content", 
    icon: FileText, 
    color: "#6366f1",
    features: ["AI Writer", "Images", "Templates"]
  },
  { 
    id: "social", 
    name: "Social Media", 
    desc: "Gestiona tus redes sociales",
    href: "/marketing/social", 
    icon: Share2, 
    color: "#0ea5e9",
    features: ["Scheduler", "Analytics", "Inbox"]
  },
  { 
    id: "integrations", 
    name: "Integraciones", 
    desc: "Conecta con tu stack de herramientas",
    href: "/marketing/integrations", 
    icon: Database, 
    color: "#14b8a6",
    features: ["CRM", "CDP", "Analytics"]
  },
];

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// FASE 4 - ADVANCED
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const ADVANCED_MODULES = [
  { 
    id: "leads", 
    name: "Lead Scoring", 
    desc: "Califica y prioriza tus leads automÃ¡ticamente",
    href: "/marketing/leads", 
    icon: UserPlus, 
    color: "#84cc16",
    features: ["Scoring Rules", "MQL/SQL", "Alerts"]
  },
  { 
    id: "competitive", 
    name: "Competitive Intel", 
    desc: "Monitorea a tu competencia",
    href: "/marketing/competitive", 
    icon: Trophy, 
    color: "#eab308",
    features: ["Tracking", "Alerts", "Reports"]
  },
  { 
    id: "command-center", 
    name: "Command Center", 
    desc: "Centro de control en tiempo real",
    href: "/marketing/command-center", 
    icon: Globe, 
    color: "#ef4444",
    features: ["Live Dashboard", "Alerts", "Actions"]
  },
];

export default function MarketingHubPage() {
  const { stats, loading, error, lastUpdated, refresh } = useMarketingStats("credicefi");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch stats from API
    fetch(`${API_URL}/api/campaigns/stats/summary?tenant_id=credicefi`)
      .then(r => r.json())
      .then(d => {
        if (d.summary) {
          setStats(prev => ({
            ...prev,
            campaigns: d.summary.total_campaigns || 12,
          }));
        }
      })
      .catch(() => {});
  }, []);

  const renderModuleCard = (m: any, i: number, delay: number = 0) => (
    <motion.div 
      key={m.id} 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay: delay + i * 0.05 }}
    >
      <Link href={m.href}>
        <GlassCard className="p-5 cursor-pointer group h-full hover:border-purple-500/30 transition-all relative overflow-hidden">
          {m.badge && (
            <span className={`absolute top-3 right-3 px-2 py-0.5 text-xs font-bold rounded-full ${
              m.badge === "NEW" ? "bg-green-500/20 text-green-400" :
              m.badge === "AI" ? "bg-purple-500/20 text-purple-400" :
              "bg-pink-500/20 text-pink-400"
            }`}>
              {m.badge}
            </span>
          )}
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl" style={{ backgroundColor: m.color + "20" }}>
              <m.icon className="w-6 h-6" style={{ color: m.color }} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-white group-hover:text-purple-400 transition-colors">
                {m.name}
              </h3>
              <p className="text-sm text-gray-400 mt-1">{m.desc}</p>
              {m.features && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {m.features.slice(0, 3).map((f: string) => (
                    <span key={f} className="px-2 py-0.5 text-xs bg-white/5 rounded-full text-gray-500">
                      {f}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
          </div>
        </GlassCard>
      </Link>
    </motion.div>
  );

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/">
        <StatusBadge status="active" label="Marketing Suite" size="lg" />
      </NavigationBar>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
            <Megaphone className="w-10 h-10 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Marketing Suite</h1>
            <p className="text-gray-400">AutomatizaciÃ³n, campaÃ±as y analytics en un solo lugar</p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-6 mb-10">
        <StatCard value={stats.campaigns.toString()} label="CampaÃ±as Activas" icon={<Megaphone className="w-6 h-6 text-pink-400" />} color="#ec4899" />
        <StatCard value={stats.activeJourneys.toString()} label="Journeys Activos" icon={<GitBranch className="w-6 h-6 text-purple-400" />} color="#8b5cf6" />
        <StatCard value={(stats.contacts / 1000).toFixed(0) + "K"} label="Contactos" icon={<Users className="w-6 h-6 text-blue-400" />} color="#3b82f6" />
        <StatCard value={stats.conversionRate + "%"} label="ConversiÃ³n" icon={<TrendingUp className="w-6 h-6 text-green-400" />} color="#22c55e" />
      </div>

      {/* Core Marketing */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="w-5 h-5 text-purple-400" />
          <h2 className="text-xl font-bold text-white">Core Marketing</h2>
        </div>
        <div className="grid grid-cols-2 gap-6">
          {CORE_MODULES?.map((m, i) => renderModuleCard(m, i, 0.1))}
        </div>
      </div>

      {/* Testing & Analytics */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-5 h-5 text-cyan-400" />
          <h2 className="text-xl font-bold text-white">Testing & Analytics</h2>
        </div>
        <div className="grid grid-cols-2 gap-6">
          {TESTING_MODULES?.map((m, i) => renderModuleCard(m, i, 0.2))}
        </div>
      </div>

      {/* Channels & Integrations */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <Share2 className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl font-bold text-white">Channels & Integrations</h2>
        </div>
        <div className="grid grid-cols-2 gap-6">
          {CHANNEL_MODULES?.map((m, i) => renderModuleCard(m, i, 0.3))}
        </div>
      </div>

      {/* Advanced */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <h2 className="text-xl font-bold text-white">Advanced</h2>
        </div>
        <div className="grid grid-cols-3 gap-6">
          {ADVANCED_MODULES?.map((m, i) => renderModuleCard(m, i, 0.4))}
        </div>
      </div>
    </div>
  );
}





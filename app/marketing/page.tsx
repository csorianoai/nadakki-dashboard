"use client";
import { motion } from "@/lib/motion-stub";
import Link from "next/link";
import { 
  GitBranch, Sparkles, Database, Target, FlaskConical, TrendingUp,
  Bot, Megaphone, Share2, BarChart3, Users, Zap,
  Map, Trophy, ArrowRight, Loader2
} from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";
import { useMarketingStats } from "@/app/hooks/useMarketingStats";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";


// ***************************************************************
// FASE 1 - CORE MARKETING
// ***************************************************************
const CORE_MODULES = [
  { 
    id: "campaigns", 
    name: "Campaigns", 
    desc: "Crea campaas multicanal con wizard de 5 pasos",
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
    name: "Segmentacin Avanzada", 
    desc: "Crea segmentos din!micos con reglas complejas",
    href: "/marketing/segments", 
    icon: Target, 
    color: "#22c55e",
    features: ["RFM", "Behavioral", "Predictive"]
  },
];

// ***************************************************************
// FASE 2 - TESTING & ANALYTICS
// ***************************************************************
const TESTING_MODULES = [
  { 
    id: "ab-testing", 
    name: "A/B Testing (local, parcial)", 
    desc: "UI de prueba: datos solo en este navegador, sin API",
    href: "/marketing/ab-testing", 
    icon: FlaskConical, 
    color: "#06b6d4",
    badge: "LOCAL",
    features: ["Variants", "Statistics", "Auto-winner"]
  },
  { 
    id: "predictive", 
    name: "Predictive Analytics", 
    desc: "Mtricas predictivas con machine learning",
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
    desc: "Mtricas en tiempo real de todas las campaas",
    href: "/marketing/analytics", 
    icon: BarChart3, 
    color: "#3b82f6",
    features: ["Real-time", "Custom Reports", "Export"]
  },
];

// ***************************************************************
// FASE 3 - CHANNELS & INTEGRATIONS
// ***************************************************************
const CHANNEL_MODULES = [
  { 
    id: "agents", 
    name: "AI Agents", 
    desc: "Agentes inteligentes para automatizacin",
    href: "/marketing/agents", 
    icon: Bot, 
    color: "#10b981",
    badge: "AI",
    features: ["Chatbots", "Email Agent", "Support"]
  },
  { 
    id: "integrations", 
    name: "Integraciones", 
    desc: "Estado real: Meta, Google, SendGrid (solo lectura)",
    href: "/marketing/integrations", 
    icon: Database, 
    color: "#14b8a6",
    features: ["OAuth", "Email", "Hub honesto"]
  },
];

// ***************************************************************
// FASE 4 - ADVANCED
// ***************************************************************
const ADVANCED_MODULES = [
  { 
    id: "competitive", 
    name: "Competitive Intel", 
    desc: "Monitorea a tu competencia",
    href: "/marketing/competitive", 
    icon: Trophy, 
    color: "#eab308",
    features: ["Tracking", "Alerts", "Reports"]
  },
];

function formatContactsValue(contacts: number): string {
  if (contacts >= 1_000_000) return `${(contacts / 1_000_000).toFixed(1)}M`;
  if (contacts >= 1_000) return `${(contacts / 1_000).toFixed(0)}K`;
  return String(contacts);
}

function statCell(
  loading: boolean,
  tenantOk: boolean,
  blockError: boolean,
  value: number | null,
  format: (n: number) => string
): string {
  if (loading) return "…";
  if (!tenantOk || blockError) return "—";
  if (value == null) return "—";
  return format(value);
}

export default function MarketingHubPage() {
  const { tenantId } = useTenant();
  const { stats, loading, error } = useMarketingStats(tenantId);

  const tenantOk = Boolean(tenantId?.trim());
  const blockError = Boolean(error) || (!loading && tenantOk && !stats);

  const statCampaigns = statCell(loading, tenantOk, blockError, stats?.campaigns ?? null, (n) => String(n));
  const statJourneys = statCell(loading, tenantOk, blockError, stats?.activeJourneys ?? null, (n) => String(n));
  const statContacts = statCell(loading, tenantOk, blockError, stats?.contacts ?? null, formatContactsValue);
  const statConversion = statCell(loading, tenantOk, blockError, stats?.conversionRate ?? null, (n) => `${n}%`);

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
            <p className="text-gray-400">Automatizacin, campaas y analytics en un solo lugar</p>
          </div>
        </div>
      </motion.div>

      {/* Stats — valores solo desde API; sin datos demo */}
      {error && (
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {error}
        </div>
      )}
      {!tenantId?.trim() && (
        <p className="mb-4 text-sm text-gray-500 m-0">Selecciona un tenant para ver métricas del hub.</p>
      )}
      <div className="grid grid-cols-4 gap-6 mb-10">
        <StatCard value={statCampaigns} label="Campaas Activas" icon={loading ? <Loader2 className="w-6 h-6 text-pink-400 animate-spin" /> : <Megaphone className="w-6 h-6 text-pink-400" />} color="#ec4899" />
        <StatCard value={statJourneys} label="Journeys Activos" icon={loading ? <Loader2 className="w-6 h-6 text-purple-400 animate-spin" /> : <GitBranch className="w-6 h-6 text-purple-400" />} color="#8b5cf6" />
        <StatCard value={statContacts} label="Contactos" icon={loading ? <Loader2 className="w-6 h-6 text-blue-400 animate-spin" /> : <Users className="w-6 h-6 text-blue-400" />} color="#3b82f6" />
        <StatCard value={statConversion} label="Conversin" icon={loading ? <Loader2 className="w-6 h-6 text-green-400 animate-spin" /> : <TrendingUp className="w-6 h-6 text-green-400" />} color="#22c55e" />
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

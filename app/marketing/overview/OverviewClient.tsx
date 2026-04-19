"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Megaphone,
  Play,
  RefreshCw,
  Share2,
  Facebook,
  Youtube,
  Linkedin,
  Twitter,
  Instagram,
  Bot,
  BarChart3,
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { DataSourceBadge } from "@/components/ui/DataSourceBadge";
import { useFetchWithFallback } from "@/hooks/useFetchWithFallback";
import { useMarketingAgents, type MarketingAgent } from "@/hooks/useMarketingAgents";
import { useMarketingCampaigns } from "@/hooks/useMarketingCampaigns";
import { useSocialConnections } from "@/hooks/useSocialConnections";
import { useTenant } from "@/contexts/TenantContext";
import { MARKETING_ENDPOINTS } from "@/lib/api/endpoints";
import { agentCountFromHealthJson } from "@/lib/api/marketing";

const PLATFORM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  meta: Facebook,
  facebook: Facebook,
  instagram: Instagram,
  google: Youtube,
  youtube: Youtube,
  linkedin: Linkedin,
  tiktok: Share2,
  x: Twitter,
  twitter: Twitter,
  pinterest: Share2,
};

function AgentCard({ agent, index }: { agent: MarketingAgent; index: number }) {
  const name = String(agent.name ?? agent.title ?? agent.id ?? "Sin nombre");
  const category = String(agent.category ?? agent.core ?? agent.group ?? "—");
  const status = (agent.status as string) ?? "inactive";
  const isActive = status?.toLowerCase() === "active";
  const agentId = (agent.id ?? agent.slug ?? name).toString().replace(/\s+/g, "-").toLowerCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <GlassCard className="p-5 hover:border-purple-500/30 transition-all">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-2 rounded-xl bg-purple-500/20">
              <Bot className="w-5 h-5 text-purple-400" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-white truncate">{name}</h3>
              <p className="text-sm text-gray-400 truncate">{category}</p>
            </div>
            <span
              className={`shrink-0 px-2 py-0.5 text-xs rounded-full ${
                isActive ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"
              }`}
            >
              {isActive ? "Activo" : "Inactivo"}
            </span>
          </div>
          <Link
            href={`/marketing/agents/${agentId}`}
            className="shrink-0 flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white text-sm font-medium transition-colors"
          >
            <Play className="w-4 h-4" />
            Ejecutar
          </Link>
        </div>
      </GlassCard>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className="p-5 rounded-2xl bg-white/5 border border-white/10 animate-pulse">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-9 h-9 rounded-xl bg-white/10" />
          <div className="flex-1">
            <div className="h-5 w-32 bg-white/10 rounded mb-2" />
            <div className="h-4 w-20 bg-white/10 rounded" />
          </div>
          <div className="h-6 w-16 bg-white/10 rounded-full" />
        </div>
        <div className="h-9 w-24 bg-white/10 rounded-lg" />
      </div>
    </div>
  );
}

function isActiveCampaignStatus(status: unknown): boolean {
  const s = String(status ?? "").toLowerCase();
  return s === "active" || s === "running" || s === "live" || s === "enabled";
}

export default function OverviewClient() {
  const { tenantId } = useTenant();
  const {
    agents,
    total: agentTotal,
    loading,
    error,
    refresh,
    source: agentSource,
  } = useMarketingAgents();
  const {
    campaigns,
    total: campaignTotal,
    loading: campaignsLoading,
    error: campaignsError,
    source: campaignSource,
    refresh: refreshCampaigns,
  } = useMarketingCampaigns();
  const {
    data: healthJson,
    loading: healthLoading,
    error: healthError,
    source: healthSource,
    refresh: refreshHealth,
  } = useFetchWithFallback<Record<string, unknown>>(MARKETING_ENDPOINTS.HEALTH, {
    tenantId,
    fallbackData: {},
  });
  const { platforms } = useSocialConnections();

  const connectedPlatforms = platforms.filter((p) => p.connected);
  const activeCampaigns = campaigns.filter((c) =>
    isActiveCampaignStatus(c.status)
  ).length;
  const agentsFromHealth = agentCountFromHealthJson(healthJson);
  const trackingTooltip = "Disponible cuando el tracking esté activado";

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/marketing">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status="active" label="Marketing Overview" size="lg" />
          <DataSourceBadge source={campaignSource} error={campaignsError} />
          <DataSourceBadge source={healthSource} error={healthError} />
          <DataSourceBadge source={agentSource} error={error} />
        </div>
      </NavigationBar>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
            <Megaphone className="w-10 h-10 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Marketing Overview</h1>
            <p className="text-gray-400">
              Campañas desde <code className="text-gray-500">/marketing/campaigns</code>, recuento de
              agentes desde <code className="text-gray-500">/health</code>, listado de agentes desde{" "}
              <code className="text-gray-500">/marketing/agents</code>. AME en <code className="text-gray-500">/ame</code>.
            </p>
          </div>
        </div>
      </motion.div>

      {/* KPIs (marketing API; no duplicar métricas AME) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-3">
        <StatCard
          value={
            campaignsLoading ? "…" : String(campaignTotal)
          }
          label="Total campañas"
          icon={<Megaphone className="w-6 h-6 text-orange-400" />}
          color="#f97316"
        />
        <StatCard
          value={campaignsLoading ? "…" : String(activeCampaigns)}
          label="Campañas activas"
          icon={<BarChart3 className="w-6 h-6 text-cyan-400" />}
          color="#22d3ee"
        />
        <div
          title={
            agentsFromHealth == null && !healthLoading
              ? "Sin recuento de agentes en la respuesta de /health"
              : undefined
          }
        >
          <StatCard
            value={
              healthLoading ? "…" : agentsFromHealth != null ? String(agentsFromHealth) : "—"
            }
            label="Agentes (/health)"
            icon={<Bot className="w-6 h-6 text-violet-400" />}
            color="#a78bfa"
          />
        </div>
        <div title={trackingTooltip}>
          <StatCard
            value="—"
            label="MAU"
            icon={<BarChart3 className="w-6 h-6 text-slate-400" />}
            color="#64748b"
          />
        </div>
        <div title={trackingTooltip}>
          <StatCard
            value="—"
            label="DAU"
            icon={<BarChart3 className="w-6 h-6 text-slate-500" />}
            color="#475569"
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <p className="text-[11px] text-gray-600 m-0">
          MAU / DAU y agentes sin dato en /health: &quot;—&quot;. {trackingTooltip}
        </p>
        <button
          type="button"
          onClick={() => {
            void refresh();
            void refreshCampaigns();
            void refreshHealth();
          }}
          className="inline-flex items-center gap-2 text-xs text-purple-300 hover:text-purple-200"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Actualizar KPIs
        </button>
      </div>

      {/* Connected platforms section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <div className="flex items-center gap-2 mb-4">
          <Share2 className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-bold text-white">Plataformas conectadas</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {connectedPlatforms.length === 0 ? (
            <p className="text-gray-500 text-sm">
              Ninguna plataforma conectada.{" "}
              <Link
                href="/marketing/social-connections"
                className="text-purple-400 hover:underline"
              >
                Conectar plataformas
              </Link>
            </p>
          ) : (
            connectedPlatforms.map((p) => {
              const Icon =
                PLATFORM_ICONS[p.platform.toLowerCase()] ?? Share2;
              return (
                <div
                  key={p.platform}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20"
                >
                  <Icon className="w-5 h-5 text-green-400" />
                  <span className="text-white font-medium capitalize">{p.platform}</span>
                </div>
              );
            })
          )}
        </div>
      </motion.div>

      {/* Agents section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">Agentes de marketing ({agentTotal})</h2>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : error ? (
        <GlassCard className="p-8 text-center">
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={refresh}
            className="inline-flex items-center gap-2 px-5 py-3 bg-purple-500 hover:bg-purple-600 rounded-xl text-white font-medium transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Reintentar
          </button>
        </GlassCard>
      ) : agents.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <p className="text-gray-400">No hay agentes disponibles.</p>
          <button
            onClick={refresh}
            className="mt-4 inline-flex items-center gap-2 px-5 py-3 bg-purple-500 hover:bg-purple-600 rounded-xl text-white font-medium"
          >
            <RefreshCw className="w-5 h-5" />
            Reintentar
          </button>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {agents.map((agent, i) => (
            <AgentCard key={agent.id ?? i} agent={agent} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

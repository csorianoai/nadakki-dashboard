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
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { useMarketingAgents, type MarketingAgent } from "@/hooks/useMarketingAgents";
import { useSocialConnections } from "@/hooks/useSocialConnections";

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

export default function OverviewClient() {
  const { agents, total, loading, error, refresh } = useMarketingAgents();
  const { platforms } = useSocialConnections();

  const connectedPlatforms = platforms.filter((p) => p.connected);

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/marketing">
        <StatusBadge status="active" label="Marketing Overview" size="lg" />
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
            <p className="text-gray-400">Agentes y plataformas conectadas</p>
          </div>
        </div>
      </motion.div>

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
        <h2 className="text-lg font-bold text-white">Agentes de marketing ({total})</h2>
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

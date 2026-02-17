"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  BarChart3,
  Play,
  RefreshCw,
  Youtube,
  ExternalLink,
  Bot,
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { useMarketingAgents, type MarketingAgent } from "@/hooks/useMarketingAgents";
import { useSocialConnections } from "@/hooks/useSocialConnections";

const GOOGLE_ADS_AGENTS = [
  "BudgetPacingIA",
  "StrategistIA",
  "RSACopyGeneratorIA",
  "SearchTermsCleanerIA",
  "OrchestratorAgent",
];

function matchesGoogleAds(agent: MarketingAgent): boolean {
  const name = (agent.name ?? agent.title ?? "").toString();
  const category = (agent.category ?? agent.core ?? "").toString().toLowerCase();
  const nameLower = name.toLowerCase();
  return (
    category.includes("google") ||
    category.includes("google ads") ||
    GOOGLE_ADS_AGENTS.some((a) => nameLower.includes(a.toLowerCase()))
  );
}

function AgentCard({ agent, index }: { agent: MarketingAgent; index: number }) {
  const name = agent.name ?? agent.title ?? agent.id ?? "Sin nombre";
  const agentId = (agent.id ?? agent.slug ?? name).toString().replace(/\s+/g, "-").toLowerCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <GlassCard className="p-5 hover:border-blue-500/30 transition-all">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/20">
              <Bot className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-white">{name}</h3>
              <p className="text-sm text-gray-400">Google Ads</p>
            </div>
          </div>
          <Link
            href={`/marketing/agents/${agentId}`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white text-sm font-medium transition-colors"
          >
            <Play className="w-4 h-4" />
            Ejecutar
          </Link>
        </div>
      </GlassCard>
    </motion.div>
  );
}

export default function GoogleAdsClient() {
  const { agents, loading, error, refresh } = useMarketingAgents();
  const { platforms } = useSocialConnections();

  const googleConnected = platforms.some(
    (p) => p.platform.toLowerCase() === "google" && p.connected
  );
  const googlePlatform = platforms.find((p) => p.platform.toLowerCase() === "google");
  const rawIds = googlePlatform?.customer_ids;
  const customerIds: string[] = Array.isArray(rawIds)
    ? rawIds.map(String)
    : rawIds != null
      ? [String(rawIds)]
      : [];

  const googleAgents = agents.filter(matchesGoogleAds);

  // Ensure we show at least the 5 known agents (from API or placeholder)
  const knownNames = new Set(googleAgents.map((a) => (a.name ?? a.title ?? "").toString().toLowerCase()));
  const missingAgents = GOOGLE_ADS_AGENTS.filter(
    (n) => !Array.from(knownNames).some((k) => k.includes(n.toLowerCase()))
  );
  const displayAgents: MarketingAgent[] = [
    ...googleAgents,
    ...missingAgents.map((name) => ({ name, category: "Google Ads", id: name })),
  ];

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/marketing">
        <StatusBadge status="active" label="Google Ads" size="lg" />
      </NavigationBar>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-red-500/20 border border-blue-500/30">
            <BarChart3 className="w-10 h-10 text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Google Ads</h1>
            <p className="text-gray-400">Agentes IA para optimización de campañas</p>
          </div>
        </div>
      </motion.div>

      {/* Banner if Google not connected */}
      {!googleConnected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8"
        >
          <GlassCard className="p-6 border-amber-500/30 bg-amber-500/5">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-amber-500/20">
                  <Youtube className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Conecta Google para continuar</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Vincula tu cuenta de Google Ads para usar los agentes
                  </p>
                </div>
              </div>
              <Link
                href="/marketing/social-connections"
                className="flex items-center gap-2 px-5 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl text-white font-medium transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Conectar Google
              </Link>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Customer IDs when connected */}
      {googleConnected && customerIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8"
        >
          <GlassCard className="p-6 border-green-500/30 bg-green-500/5">
            <h3 className="font-bold text-white mb-2">Cuentas conectadas</h3>
            <div className="flex flex-wrap gap-2">
              {customerIds.map((id) => (
                <span
                  key={id}
                  className="px-3 py-1 rounded-lg bg-white/10 text-gray-300 text-sm font-mono"
                >
                  {id}
                </span>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Agents list */}
      <h2 className="text-lg font-bold text-white mb-4">Agentes de Google Ads</h2>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white/5 border border-white/10 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/10" />
                  <div className="h-5 w-40 bg-white/10 rounded" />
                </div>
                <div className="h-9 w-24 bg-white/10 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <GlassCard className="p-8 text-center">
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={refresh}
            className="inline-flex items-center gap-2 px-5 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl text-white font-medium"
          >
            <RefreshCw className="w-5 h-5" />
            Reintentar
          </button>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {displayAgents.map((agent, i) => (
            <AgentCard key={agent.id ?? agent.name ?? i} agent={agent} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

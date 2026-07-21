"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bot, Megaphone, RefreshCw, Rocket } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import { DataSourceBadge } from "@/components/ui/DataSourceBadge";
import { AgentGrid } from "@/components/marketing/AgentGrid";
import { CampaignCard } from "@/components/marketing/CampaignCard";
import { ScheduleCalendar } from "@/components/marketing/ScheduleCalendar";
import { useTenant } from "@/contexts/TenantContext";
import {
  executeCampaign,
  fetchAgents,
  fetchCampaigns,
  type MarketingAgent,
  type MarketingCampaign,
} from "@/lib/marketing-api";
import type { FetchSource } from "@/lib/api/client";

export default function MarketingDashboardPage() {
  const { tenantId } = useTenant();
  const [agents, setAgents] = useState<MarketingAgent[]>([]);
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [agentTotal, setAgentTotal] = useState(0);
  const [campaignTotal, setCampaignTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [agentSource, setAgentSource] = useState<FetchSource>("fallback");
  const [campaignSource, setCampaignSource] = useState<FetchSource>("fallback");
  const [error, setError] = useState<string | null>(null);
  const [agentSearch, setAgentSearch] = useState("");
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [executeMsg, setExecuteMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setExecuteMsg(null);
    const [a, c] = await Promise.all([fetchAgents(tenantId, 1000), fetchCampaigns(tenantId)]);
    setAgents(a.agents);
    setAgentTotal(a.total);
    setAgentSource(a.source);
    setCampaigns(c.campaigns);
    setCampaignTotal(c.total);
    setCampaignSource(c.source);
    const err = [a.error, c.error].filter(Boolean).join(" · ") || null;
    setError(err);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleExecute = async (campaignId: string) => {
    if (!tenantId) {
      setExecuteMsg("Selecciona un tenant para ejecutar campañas.");
      return;
    }
    setExecutingId(campaignId);
    setExecuteMsg(null);
    const r = await executeCampaign(tenantId, campaignId, { dry_run: false });
    setExecutingId(null);
    if (r.ok) {
      setExecuteMsg(`Campaña ${campaignId} ejecutada correctamente.`);
      void load();
    } else {
      setExecuteMsg(r.error ?? "Error al ejecutar campaña");
    }
  };

  const liveOk = agentSource === "live" || campaignSource === "live";

  return (
    <div className="ndk-page ndk-fade-in min-h-screen text-white p-6">
      <NavigationBar backHref="/marketing">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-400">Marketing Core Dashboard</span>
          <DataSourceBadge source={liveOk ? "live" : "fallback"} error={error} />
        </div>
      </NavigationBar>

      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
            <Rocket className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white m-0">Marketing Dashboard</h1>
            <p className="text-gray-400 text-sm m-0 mt-1">
              {loading
                ? "Cargando…"
                : `${agentTotal} agentes · ${campaignTotal} campañas · API marketing`}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/marketing/campaigns/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500/90 hover:bg-orange-500 text-sm font-medium"
          >
            <Megaphone className="w-4 h-4" />
            Nueva campaña
          </Link>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>
      </div>

      {error && !liveOk ? (
        <GlassCard className="p-4 mb-6 border-amber-500/30 bg-amber-500/5">
          <p className="text-amber-200/90 text-sm m-0">{error}</p>
        </GlassCard>
      ) : null}

      {executeMsg ? (
        <GlassCard className="p-3 mb-6 border-white/10">
          <p className="text-sm text-gray-300 m-0">{executeMsg}</p>
        </GlassCard>
      ) : null}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          value={loading ? "…" : String(agentTotal)}
          label="Marketing Agents"
          icon={<Bot className="w-6 h-6 text-green-400" />}
          color="#22c55e"
        />
        <StatCard
          value={loading ? "…" : String(campaignTotal)}
          label="Campaigns"
          icon={<Megaphone className="w-6 h-6 text-orange-400" />}
          color="#f97316"
        />
        <StatCard
          value={loading ? "…" : String(agents.filter((a) => String(a.status).toLowerCase() === "active").length)}
          label="Agents Active"
          icon={<Bot className="w-6 h-6 text-purple-400" />}
          color="#8b5cf6"
        />
        <StatCard
          value={loading ? "…" : String(campaigns.filter((c) => String(c.status).toLowerCase() === "active").length)}
          label="Campaigns Active"
          icon={<Rocket className="w-6 h-6 text-cyan-400" />}
          color="#06b6d4"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        <div className="xl:col-span-2">
          <GlassCard className="p-5 border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white m-0 flex items-center gap-2">
                <Bot className="w-5 h-5 text-green-400" />
                AI Agents
              </h2>
              <Link href="/marketing/agents" className="text-xs text-purple-400 hover:underline">
                Ver catálogo completo
              </Link>
            </div>
            <AgentGrid
              agents={agents}
              loading={loading}
              maxVisible={9}
              showSearch
              search={agentSearch}
              onSearchChange={setAgentSearch}
            />
          </GlassCard>
        </div>
        <ScheduleCalendar campaigns={campaigns} loading={loading} />
      </div>

      <GlassCard className="p-5 border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white m-0 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-orange-400" />
            Campañas recientes
          </h2>
          <Link href="/marketing/campaigns" className="text-xs text-orange-400 hover:underline">
            Ver todas
          </Link>
        </div>
        {loading ? (
          <p className="text-sm text-gray-500 m-0">Cargando campañas…</p>
        ) : campaigns.length === 0 ? (
          <p className="text-sm text-gray-500 m-0">No hay campañas. Crea una desde el wizard.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {campaigns.slice(0, 6).map((c) => (
              <CampaignCard
                key={String(c.id ?? c.campaign_id)}
                campaign={c}
                onExecute={tenantId ? handleExecute : undefined}
                executingId={executingId}
              />
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

"use client";

import Link from "next/link";
import { motion } from "@/lib/motion-stub";
import {
  Bot,
  Plus,
  Play,
  MessageSquare,
  Search,
  RefreshCw,
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { DataSourceBadge } from "@/components/ui/DataSourceBadge";
import { useMarketingAgents } from "@/hooks/useMarketingAgents";
import { useState, useMemo } from "react";

const TEMPLATES = [
  { id: "t1", name: "Customer Support", desc: "24/7 support bot", icon: MessageSquare },
  { id: "t2", name: "Lead Qualifier", desc: "Qualify and route leads", icon: Bot },
];

export default function AgentsPage() {
  const { agents, total, loading, error, source, refresh } = useMarketingAgents();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return agents;
    return agents.filter((a) => {
      const n = String(a.name ?? a.title ?? "").toLowerCase();
      const d = String(a.description ?? "").toLowerCase();
      return n.includes(q) || d.includes(q);
    });
  }, [agents, search]);

  const activeCount = agents.filter(
    (a) => String(a.status ?? "").toLowerCase() === "active"
  ).length;

  const trackingTitle = "Disponible cuando tracking esté activo";

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/marketing">
        <div className="flex items-center gap-2">
          <StatusBadge status="active" label="AI Agents" size="lg" />
          <DataSourceBadge source={source} error={error} />
        </div>
      </NavigationBar>

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
            <Bot className="w-8 h-8 text-green-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">AI Agents</h1>
            <p className="text-gray-400 text-sm m-0">
              Listado desde GET /marketing/agents
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void refresh()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white text-sm hover:bg-white/15"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-3 bg-green-500 hover:bg-green-600 rounded-xl text-white font-medium"
          >
            <Plus className="w-5 h-5" /> Create Agent
          </button>
        </div>
      </div>

      {error && source === "fallback" && (
        <GlassCard className="p-4 mb-6 border-amber-500/30 bg-amber-500/5">
          <p className="text-amber-200/90 text-sm m-0">
            API no disponible ({error}). Mostrando listado vacío.
          </p>
        </GlassCard>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          value={loading ? "…" : String(total)}
          label="Total Agents"
          icon={<Bot className="w-6 h-6 text-purple-400" />}
          color="#8b5cf6"
        />
        <StatCard
          value={loading ? "…" : String(activeCount)}
          label="Active"
          icon={<Play className="w-6 h-6 text-green-400" />}
          color="#22c55e"
        />
        <div title={trackingTitle}>
          <StatCard
            value="—"
            label="Conversations"
            icon={<MessageSquare className="w-6 h-6 text-blue-400" />}
            color="#3b82f6"
          />
        </div>
        <div title={trackingTitle}>
          <StatCard
            value="—"
            label="Avg success"
            icon={<Bot className="w-6 h-6 text-yellow-400" />}
            color="#f59e0b"
          />
        </div>
      </div>

      <div className="relative flex-1 max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          placeholder="Search agents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500"
        />
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-16 text-sm">Cargando…</div>
      ) : filtered.length === 0 ? (
        <GlassCard className="p-10 text-center border-white/10">
          <p className="text-gray-400 m-0">No hay agentes para mostrar.</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((agent, i) => {
            const name = String(agent.name ?? agent.title ?? "Sin nombre");
            const idRaw = agent.id ?? agent.slug ?? name;
            const id = String(idRaw).replace(/\s+/g, "-").toLowerCase();
            const status = String(agent.status ?? "inactive");
            const isActive = status.toLowerCase() === "active";
            const desc = String(agent.description ?? agent.category ?? "—");
            return (
              <motion.div
                key={String(agent.id ?? id)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <GlassCard className="p-5 hover:border-green-500/30 transition-all">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-3 rounded-xl bg-green-500/20">
                        <Bot className="w-6 h-6 text-green-400" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-white truncate">{name}</h3>
                        <p className="text-sm text-gray-400 line-clamp-2">{desc}</p>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 px-2 py-0.5 text-xs rounded-full ${
                        isActive
                          ? "bg-green-500/20 text-green-400"
                          : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {status}
                    </span>
                  </div>
                  <div className="flex justify-end pt-2 border-t border-white/10">
                    <Link
                      href={`/marketing/agents/${encodeURIComponent(id)}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white text-sm font-medium"
                    >
                      <Play className="w-4 h-4" />
                      Ejecutar
                    </Link>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowCreate(false)}
        >
          <div
            className="bg-[#0a0f1c] border border-white/10 rounded-2xl w-full max-w-lg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-white mb-2">Create New Agent</h3>
            <p className="text-sm text-gray-400 mb-4">
              Elija una plantilla para empezar (flujo local; la publicación en API
              depende del backend).
            </p>
            <div className="space-y-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className="w-full p-3 rounded-xl border border-white/10 text-left hover:border-green-500/50 text-gray-200"
                >
                  <div className="font-medium text-white">{t.name}</div>
                  <div className="text-xs text-gray-500">{t.desc}</div>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="mt-6 w-full py-2 rounded-lg bg-white/10 text-gray-300 text-sm"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

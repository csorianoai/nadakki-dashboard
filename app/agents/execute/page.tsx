"use client";

import { useState, useEffect } from "react";
import AgentExecuteButton from "@/components/agents/AgentExecuteButton";
import { useTenant } from "@/contexts/TenantContext";

interface Agent {
  agent_id: string;
  name: string;
  category: string;
  description?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Lead Management": "bg-blue-100 text-blue-700 border-blue-200",
  "Experimentation": "bg-purple-100 text-purple-700 border-purple-200",
  "Campaign": "bg-amber-100 text-amber-700 border-amber-200",
  "Content": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Social Media": "bg-pink-100 text-pink-700 border-pink-200",
  "Analytics": "bg-cyan-100 text-cyan-700 border-cyan-200",
  "Intelligence": "bg-red-100 text-red-700 border-red-200",
  "Attribution": "bg-orange-100 text-orange-700 border-orange-200",
  "Forecasting": "bg-indigo-100 text-indigo-700 border-indigo-200",
  "Segmentation": "bg-teal-100 text-teal-700 border-teal-200",
  "Personalization": "bg-violet-100 text-violet-700 border-violet-200",
  "Email": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "Influencer": "bg-rose-100 text-rose-700 border-rose-200",
  "Customer Journey": "bg-sky-100 text-sky-700 border-sky-200",
  "Retention": "bg-lime-100 text-lime-700 border-lime-200",
  "Product": "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
  "Pricing": "bg-stone-100 text-stone-700 border-stone-200",
  "Creative": "bg-pink-100 text-pink-700 border-pink-200",
  "Data Quality": "bg-slate-100 text-slate-700 border-slate-200",
  "Offers": "bg-amber-100 text-amber-700 border-amber-200",
  "Forms": "bg-zinc-100 text-zinc-700 border-zinc-200",
  "Orchestration": "bg-blue-100 text-blue-700 border-blue-200",
  "Google Ads": "bg-cyan-100 text-cyan-700 border-cyan-200",
  General: "bg-gray-100 text-gray-700 border-gray-200",
};

function getCategoryCounts(agents: Agent[]): Record<string, number> {
  return agents.reduce((acc, a) => {
    acc[a.category] = (acc[a.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

export default function AgentExecutePage() {
  const { tenantId } = useTenant();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [totalCatalog, setTotalCatalog] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState<boolean>(false);
  const [showLiveModal, setShowLiveModal] = useState<boolean>(false);

  const handleLiveToggle = (checked: boolean) => {
    if (checked) {
      setShowLiveModal(true);
    } else {
      setIsLive(false);
    }
  };

  const confirmLive = () => {
    setIsLive(true);
    setShowLiveModal(false);
  };

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://nadakki-ai-suite.onrender.com";
    fetch(`${apiUrl}/health`)
      .then((r) => (r.ok ? setBackendStatus("online") : setBackendStatus("offline")))
      .catch(() => setBackendStatus("offline"));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch("/api/ai-studio/agents")
      .then((r) => r.json())
      .then((d) => {
        const raw = d.data?.agents || [];
        setTotalCatalog(d.data?.total ?? raw.length);
        const filtered = raw
          .filter((a: { action_methods?: string[] }) => a.action_methods?.includes("execute"))
          .filter((a: { agent_id?: string; id?: string }) => !String(a.agent_id || a.id || "").includes("_backup_"))
          .map((a: { agent_id?: string; id?: string; name?: string; category?: string; class_name?: string; description?: string }) => ({
            agent_id: a.agent_id || a.id || "",
            name: a.name || a.class_name?.replace(/AgentOperative|Operative/g, "").replace(/([A-Z])/g, " $1").trim() || "",
            category: a.category || "General",
            description: a.description || "",
          }))
          .filter((a: Agent) => a.agent_id);
        setAgents(filtered);
      })
      .catch((e) => {
        setError(String(e?.message || e));
        setAgents([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const categories = ["all", ...Array.from(new Set(agents.map((a) => a.category))).sort()];
  const categoryCounts = getCategoryCounts(agents);

  const filtered = agents
    .filter((a) => selectedCategory === "all" || a.category === selectedCategory)
    .filter(
      (a) =>
        searchTerm === "" ||
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.description || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center py-24 text-gray-500">
          <div className="animate-spin w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full mb-4" />
          <p className="text-lg">Cargando catálogo de agentes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-center">
          <p className="text-red-700 font-medium">Error al cargar agentes</p>
          <p className="text-red-600 text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Ejecutar Agentes de Marketing</h1>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Tenant:</span>
              <span className="text-sm font-medium">{tenantId ?? "—"}</span>
            </div>
            {/* LIVE toggle */}
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-sm text-gray-600">LIVE</span>
                <input
                  type="checkbox"
                  checked={isLive}
                  onChange={(e) => handleLiveToggle(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
              </label>
            </div>
            {/* Mode badge */}
            <span
              className={`px-2 py-1 rounded text-xs font-semibold ${
                isLive ? "bg-red-100 text-red-700 border border-red-200" : "bg-amber-100 text-amber-700 border border-amber-200"
              }`}
            >
              MODE: {isLive ? "LIVE" : "DRY_RUN"}
            </span>
            <div className="flex items-center gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  backendStatus === "online" ? "bg-green-500" : backendStatus === "offline" ? "bg-red-500" : "bg-yellow-500 animate-pulse"
                }`}
              />
              <span className="text-sm text-gray-500">
                {backendStatus === "online" ? "Backend Online" : backendStatus === "offline" ? "Backend Offline" : "Verificando..."}
              </span>
            </div>
          </div>
        </div>
        <p className="text-gray-500 mb-4">
          {agents.length} ejecutables de {totalCatalog} total. Modo DRY RUN por defecto.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-700">{agents.length}</div>
            <div className="text-xs text-blue-500">Ejecutables</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-700">{totalCatalog}</div>
            <div className="text-xs text-green-500">Total Catálogo</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-purple-700">{categories.length - 1}</div>
            <div className="text-xs text-purple-500">Categorías</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-amber-700">GDPR</div>
            <div className="text-xs text-amber-500">Compliance</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar agente por nombre, categoría o descripción..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${
              selectedCategory === cat ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {cat === "all" ? `Todos (${agents.length})` : `${cat} (${categoryCounts[cat] || 0})`}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-400 mb-4">
        Mostrando {filtered.length} de {agents.length} agentes
      </p>

      {/* Empty state - no agents at all */}
      {agents.length === 0 && (
        <div className="text-center py-16 rounded-xl bg-gray-50 border border-gray-200">
          <p className="text-lg text-gray-600 mb-2">No hay agentes ejecutables</p>
          <p className="text-sm text-gray-500">El catálogo no devolvió agentes con método execute.</p>
        </div>
      )}

      {/* Agent Grid */}
      {agents.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((agent) => {
            const colorClass = CATEGORY_COLORS[agent.category] || "bg-gray-100 text-gray-700 border-gray-200";
            return (
              <div
                key={agent.agent_id}
                className="border rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-all hover:border-blue-300"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 text-sm truncate">{agent.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{agent.description || agent.agent_id}</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-green-500 ml-2 mt-1 flex-shrink-0" title="Operativo" />
                </div>
                <div className="mb-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${colorClass}`}>{agent.category}</span>
                </div>
                <AgentExecuteButton agentId={agent.agent_id} agentName={agent.name} tenantId={tenantId} isLive={isLive} />
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state - filtered */}
      {agents.length > 0 && filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-2">No se encontraron agentes</p>
          <p className="text-sm">Intenta con otro término de búsqueda o categoría</p>
        </div>
      )}

      {/* LIVE confirmation modal */}
      {showLiveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowLiveModal(false)}>
          <div className="bg-white rounded-xl p-6 max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Activar modo LIVE</h3>
            <p className="text-gray-600 mb-4">
              ¿Activar LIVE para tenant <strong>{tenantId}</strong>? Las ejecuciones afectarán datos reales.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowLiveModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button onClick={confirmLive} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                Activar LIVE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

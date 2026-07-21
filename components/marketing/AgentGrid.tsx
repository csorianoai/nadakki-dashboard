"use client";

import Link from "next/link";
import { Bot, Play } from "lucide-react";
import type { MarketingAgent } from "@/lib/marketing-api";
import { agentDisplayName, agentRowId } from "@/lib/marketing-api";

type AgentGridProps = {
  agents: MarketingAgent[];
  loading?: boolean;
  maxVisible?: number;
  showSearch?: boolean;
  search?: string;
  onSearchChange?: (value: string) => void;
};

export function AgentGrid({
  agents,
  loading = false,
  maxVisible = 12,
  showSearch = false,
  search = "",
  onSearchChange,
}: AgentGridProps) {
  const q = search.toLowerCase().trim();
  const filtered = q
    ? agents.filter((a) => {
        const n = agentDisplayName(a).toLowerCase();
        const d = String(a.description ?? a.category ?? "").toLowerCase();
        return n.includes(q) || d.includes(q);
      })
    : agents;

  const visible = filtered.slice(0, maxVisible);

  if (loading) {
    return (
      <div className="py-12 text-center text-gray-400 text-sm">Cargando agentes…</div>
    );
  }

  return (
    <div>
      {showSearch && onSearchChange ? (
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar agentes…"
          className="w-full mb-4 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm"
        />
      ) : null}
      {visible.length === 0 ? (
        <p className="text-sm text-gray-500 m-0 py-8 text-center">No hay agentes para mostrar.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((agent) => {
            const name = agentDisplayName(agent);
            const id = agentRowId(agent).replace(/\s+/g, "-").toLowerCase();
            const status = String(agent.status ?? "inactive");
            const isActive = status.toLowerCase() === "active";
            const category = String(agent.category ?? agent.platform ?? "marketing");
            return (
              <div
                key={String(agent.id ?? id)}
                className="rounded-xl border border-white/10 bg-white/5 p-4 hover:border-green-500/30 transition-colors"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-green-500/20 shrink-0">
                    <Bot className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-white text-sm truncate m-0">{name}</h3>
                    <p className="text-xs text-gray-500 mt-1 m-0 truncate">{category}</p>
                  </div>
                  <span
                    className={`shrink-0 px-2 py-0.5 text-[10px] rounded-full ${
                      isActive ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {status}
                  </span>
                </div>
                <div className="flex justify-end pt-2 border-t border-white/10">
                  <Link
                    href={`/marketing/agents/${encodeURIComponent(id)}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-500 hover:bg-purple-600 text-white"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Ejecutar
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {filtered.length > maxVisible ? (
        <p className="text-xs text-gray-500 mt-3 m-0 text-center">
          Mostrando {maxVisible} de {filtered.length} agentes.{" "}
          <Link href="/marketing/agents" className="text-purple-400 hover:underline">
            Ver todos
          </Link>
        </p>
      ) : null}
    </div>
  );
}

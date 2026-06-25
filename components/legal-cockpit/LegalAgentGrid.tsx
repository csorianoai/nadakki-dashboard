"use client";

import { useState } from "react";
import type { LegalAgent } from "@/lib/legal-cockpit/types";

const CATS = [
  { key: "all", label: "Todos" },
  { key: "documentos", label: "Documentos" },
  { key: "litigio", label: "Litigio" },
  { key: "compliance", label: "Compliance" },
  { key: "investigacion", label: "Investigación" },
  { key: "plazos", label: "Plazos" },
];

interface Props {
  agents: LegalAgent[];
  onAgent: (agentId: string) => void;
  loading?: boolean;
}

export function LegalAgentGrid({ agents, onAgent, loading }: Props) {
  const [cat, setCat] = useState("all");

  const filtered =
    cat === "all" ? agents : agents.filter((a) => a.category === cat);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-7 w-20 bg-zinc-800 rounded-lg animate-pulse"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-36 bg-zinc-900 rounded-xl border border-zinc-800 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        {CATS.map((c) => (
          <button
            key={c.key}
            onClick={() => setCat(c.key)}
            className={`text-[11px] px-3 py-1.5 rounded-lg border transition-all ${
              cat === c.key
                ? "bg-violet-950/50 text-violet-400 border-violet-700/50"
                : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-700"
            }`}
          >
            {c.label}
          </button>
        ))}
        <span className="text-[10px] text-zinc-600 ml-1">
          {filtered.length} agentes
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((agent) => (
          <div
            key={agent.id}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-4
                       hover:border-violet-800/50 transition-colors group"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-violet-950/60 border border-violet-800/30
                              flex items-center justify-center flex-shrink-0">
                <span className="text-violet-400 text-xs font-mono">
                  {agent.id.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-white">{agent.name}</p>
                  {agent.status === "active" && (
                    <span className="text-[9px] bg-emerald-950/40 text-emerald-500
                                     border border-emerald-800/40 px-1.5 py-0.5 rounded">
                      activo
                    </span>
                  )}
                  {agent.status === "beta" && (
                    <span className="text-[9px] bg-amber-950/40 text-amber-500
                                     border border-amber-800/40 px-1.5 py-0.5 rounded">
                      beta
                    </span>
                  )}
                  {agent.demoData && (
                    <span className="text-[9px] text-zinc-600">demo</span>
                  )}
                </div>
                <p className="text-[10px] text-zinc-500 truncate">
                  {agent.subtitle}
                </p>
              </div>
            </div>
            <p className="text-xs text-zinc-400 line-clamp-2 mb-3 leading-relaxed">
              {agent.description}
            </p>
            <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
              <span className="text-[10px] text-emerald-500 font-medium">
                {agent.estimatedSavings}
              </span>
              <button
                onClick={() => onAgent(agent.id)}
                className="text-[11px] px-3 py-1.5 rounded-lg border border-zinc-700
                           text-zinc-400 bg-zinc-800/30 hover:border-violet-700/50
                           hover:text-violet-400 transition-all group-hover:border-violet-800/50"
              >
                Usar agente &rarr;
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

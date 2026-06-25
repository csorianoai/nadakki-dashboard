"use client";

import { useState } from "react";
import type { LegalUrgentMatter } from "@/lib/legal-cockpit/types";

const URG = {
  critical: {
    border: "border-l-red-500",
    badge: "bg-red-950/40 text-red-400 border-red-800/40",
    label: "Urgente",
    dot: "bg-red-500 animate-pulse",
  },
  warning: {
    border: "border-l-amber-500",
    badge: "bg-amber-950/40 text-amber-400 border-amber-800/40",
    label: "Atención",
    dot: "bg-amber-500",
  },
  active: {
    border: "border-l-blue-500",
    badge: "bg-blue-950/40 text-blue-400 border-blue-800/40",
    label: "Activo",
    dot: "bg-blue-500",
  },
  blocked: {
    border: "border-l-zinc-600",
    badge: "bg-zinc-800/40 text-zinc-400 border-zinc-700/40",
    label: "Bloqueado",
    dot: "bg-zinc-500",
  },
};

interface Props {
  matters: LegalUrgentMatter[];
  onAction: (matter: LegalUrgentMatter, actionKey: string) => void;
  loading?: boolean;
}

export function LegalUrgentMatters({ matters, onAction, loading }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
          <div className="h-4 w-40 bg-zinc-800 rounded animate-pulse" />
        </div>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="px-4 py-4 border-b border-zinc-800 last:border-0 animate-pulse"
          >
            <div className="h-3 w-48 bg-zinc-800 rounded mb-2" />
            <div className="h-3 w-72 bg-zinc-700 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (matters.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
        <p className="text-sm text-zinc-400">
          No hay casos urgentes pendientes
        </p>
        <p className="text-xs text-zinc-600 mt-1">
          Todos los plazos están al día
        </p>
      </div>
    );
  }

  return (
    <div
      id="urgentes"
      className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-medium text-white">
            Atención legal de hoy
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">
            {matters.length} casos
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-[10px] text-zinc-500">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            urgente
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            atención
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            activo
          </span>
        </div>
      </div>

      <div className="divide-y divide-zinc-800">
        {matters.map((m) => {
          const u = URG[m.urgency];
          const isOpen = expanded === m.id;
          return (
            <div
              key={m.id}
              className={`border-l-4 ${u.border} cursor-pointer hover:bg-zinc-800/30 transition-colors`}
              onClick={() => setExpanded(isOpen ? null : m.id)}
            >
              <div className="px-4 py-3 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-[11px] font-mono text-zinc-500">
                      {m.caseNumber}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 ${u.badge}`}
                    >
                      <span className={`w-1 h-1 rounded-full ${u.dot}`} />
                      {u.label}
                    </span>
                    {m.demoData && (
                      <span className="text-[9px] text-zinc-600">demo</span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-white">{m.title}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{m.summary}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction(m, "primary");
                  }}
                  className="text-[11px] px-3 py-1.5 rounded-lg border border-zinc-700
                             text-zinc-300 hover:border-violet-700 hover:text-violet-300
                             transition-all flex-shrink-0 bg-zinc-800/40"
                >
                  Resolver ahora
                </button>
              </div>
              {isOpen && (
                <div className="px-4 pb-3 space-y-2">
                  {m.pendingTasks.map((t, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-xs text-zinc-400
                                 bg-zinc-800/40 rounded-lg px-3 py-2"
                    >
                      <span className="text-zinc-600 mt-0.5">·</span>
                      {t}
                    </div>
                  ))}
                  {m.suggestions.map((s) => (
                    <button
                      key={s.actionKey}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAction(m, s.actionKey);
                      }}
                      className="w-full flex items-center gap-2 text-xs text-violet-400
                                 bg-violet-950/20 border border-violet-800/40 rounded-lg
                                 px-3 py-2 hover:bg-violet-950/40 transition-colors text-left"
                    >
                      <span className="text-violet-600 text-[10px]">*</span>
                      {s.text}
                      <span className="ml-auto text-violet-600 text-[10px]">
                        &rarr;
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="px-4 py-2 border-t border-zinc-800 flex justify-between text-[10px] text-zinc-600">
        <span>Actualizado ahora</span>
        <span>
          {matters.filter((m) => m.urgency === "critical").length} críticos
        </span>
      </div>
    </div>
  );
}

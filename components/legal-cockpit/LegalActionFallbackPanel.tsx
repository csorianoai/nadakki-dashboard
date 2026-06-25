"use client";

import type { FallbackAction } from "@/lib/legal-cockpit/types";
import { LEGAL_ROUTES } from "@/lib/legal-cockpit/routes";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  action: FallbackAction;
  onDismiss: () => void;
}

export function LegalActionFallbackPanel({ action, onDismiss }: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(action.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback silencioso
    }
  }

  return (
    <div className="bg-amber-950/20 border border-amber-800/40 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 text-sm">*</span>
          <span className="text-sm font-medium text-white">{action.title}</span>
        </div>
        <button
          onClick={onDismiss}
          className="text-zinc-600 hover:text-zinc-400 text-xs"
        >
          &times;
        </button>
      </div>
      <p className="text-xs text-zinc-400 mb-3">
        Agente:{" "}
        <span className="text-violet-400 font-mono">{action.agentId}</span>
      </p>
      <div className="bg-zinc-900/60 rounded-lg p-3 mb-3 font-mono text-xs text-zinc-300
                      leading-relaxed border border-zinc-800">
        {action.prompt}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={copyPrompt}
          className="text-xs px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-300
                     hover:border-emerald-700 hover:text-emerald-400 transition-all"
        >
          {copied ? "Copiado" : "Copiar prompt"}
        </button>
        <button
          onClick={() => router.push(LEGAL_ROUTES.research)}
          className="text-xs px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-300
                     hover:border-violet-700 hover:text-violet-400 transition-all"
        >
          Abrir investigación
        </button>
        <button
          onClick={() => router.push(LEGAL_ROUTES.cases)}
          className="text-xs px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-300
                     hover:border-blue-700 hover:text-blue-400 transition-all"
        >
          Ver expedientes
        </button>
      </div>
    </div>
  );
}

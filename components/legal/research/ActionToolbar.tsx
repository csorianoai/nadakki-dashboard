"use client";

import { Copy, FileText, RefreshCw, Share2, FileDown } from "lucide-react";
import type { AgentRunResponse } from "@/types/legal";
import { buildCopyPayload } from "@/lib/legal/research/citation-utils";
import { toast } from "@/components/forge/ui/Toast";
import { cn } from "@/lib/utils";

type Props = {
  content: string;
  run?: AgentRunResponse;
  onNewChat: () => void;
  className?: string;
};

function roadmapToast(feature: string) {
  toast.info(`${feature} — en desarrollo. Requiere endpoint backend; no hay export/share disponible aún.`);
}

export function ActionToolbar({ content, run, onNewChat, className }: Props) {
  const copyText = async (text: string, label: string) => {
    if (!text.trim()) {
      toast.error("Nada que copiar");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success(label);
    } catch {
      toast.error("No se pudo copiar al portapapeles");
    }
  };

  const btnBase =
    "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--legal-accent)]";

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-wrap gap-2" role="toolbar" aria-label="Acciones disponibles">
        <button
          type="button"
          className={cn(btnBase, "border-[var(--legal-border)] bg-[var(--legal-surface-1)] text-zinc-100 hover:border-[var(--legal-accent-strong)]")}
          onClick={() => void copyText(content, "Respuesta copiada")}
        >
          <Copy className="h-3.5 w-3.5" aria-hidden />
          Copiar respuesta
        </button>
        <button
          type="button"
          className={cn(btnBase, "border-[var(--legal-border)] bg-[var(--legal-surface-1)] text-zinc-100 hover:border-[var(--legal-accent-strong)]")}
          onClick={() => void copyText(buildCopyPayload(content, run), "Respuesta + citas copiadas")}
        >
          <FileText className="h-3.5 w-3.5" aria-hidden />
          Copiar + citas
        </button>
        <button
          type="button"
          className={cn(btnBase, "border-[var(--legal-border)] bg-[var(--legal-surface-1)] text-zinc-100 hover:border-[var(--legal-accent-strong)]")}
          disabled={!run?.request_id}
          onClick={() => run?.request_id && void copyText(run.request_id, "Request ID copiado")}
        >
          <Copy className="h-3.5 w-3.5" aria-hidden />
          Request ID
        </button>
        <button
          type="button"
          className={cn(btnBase, "border-[var(--legal-accent-strong)]/40 bg-[var(--legal-accent-strong)]/10 text-[var(--legal-accent)] hover:bg-[var(--legal-accent-strong)]/20")}
          onClick={onNewChat}
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden />
          Nueva consulta
        </button>
      </div>
      <div className="flex flex-wrap gap-2" aria-label="Funciones en desarrollo">
        <span className="w-full text-[10px] uppercase tracking-wider text-zinc-500">En desarrollo</span>
        {(
          [
            ["PDF", FileDown],
            ["Word", FileText],
            ["Compartir", Share2],
          ] as const
        ).map(([label, Icon]) => (
          <button
            key={label}
            type="button"
            className={cn(
              btnBase,
              "border-zinc-700/80 bg-zinc-900/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300",
            )}
            onClick={() => roadmapToast(`Export ${label}`)}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

"use client";

import { Scale } from "lucide-react";
import type { AgentRunResponse } from "@/types/legal";
import { MarkdownResponse } from "@/components/legal/research/MarkdownResponse";
import { ActionToolbar } from "@/components/legal/research/ActionToolbar";
import { ResearchCitationCard } from "@/components/legal/research/ResearchCitationCard";
import { scrollToCitation } from "@/lib/legal/research/citation-utils";
import { cn } from "@/lib/utils";

type Props = {
  content: string;
  run?: AgentRunResponse;
  selected: boolean;
  highlightSourceId: string | null;
  onSelect: () => void;
  onHighlightSourceId: (id: string | null) => void;
  onNewChat: () => void;
};

export function AssistantResponseBlock({
  content,
  run,
  selected,
  highlightSourceId,
  onSelect,
  onHighlightSourceId,
  onNewChat,
}: Props) {
  const citations = run?.citations ?? [];
  const isError = content.startsWith("**Error**");

  return (
    <article
      className={cn(
        "w-full rounded-xl border bg-[var(--legal-surface-1)] transition",
        selected ? "border-[var(--legal-accent-strong)]/60 ring-1 ring-[var(--legal-accent-strong)]/30" : "border-[var(--legal-border)]",
      )}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect();
      }}
      role="button"
      tabIndex={0}
      aria-selected={selected}
    >
      <header className="flex items-center gap-2 border-b border-[var(--legal-border)] px-4 py-2">
        <Scale className="h-4 w-4 text-[var(--legal-accent)]" aria-hidden />
        <span className="text-xs font-medium uppercase tracking-wide text-[var(--legal-text-secondary)]">
          Asistente legal
        </span>
        {run?.monitor?.riesgo_evaluado ? (
          <span className="ml-auto rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] uppercase text-zinc-300">
            riesgo {run.monitor.riesgo_evaluado}
          </span>
        ) : null}
      </header>

      <div className="px-4 py-4">
        {isError ? (
          <p className="whitespace-pre-wrap text-sm text-red-200">{content.replace(/^\*\*Error\*\*\n?/, "")}</p>
        ) : (
          <MarkdownResponse
            content={content}
            citations={citations}
            onCitationClick={(id) => scrollToCitation(id, () => onHighlightSourceId(id))}
          />
        )}

        {run?.monitor?.alertas && run.monitor.alertas.length > 0 ? (
          <div className="mt-4 rounded border border-amber-700/50 bg-amber-950/40 p-2 text-xs text-amber-100">
            <strong>Alertas:</strong> {run.monitor.alertas.join(", ")}
          </div>
        ) : null}

        {run?.requiere_revision_abogado ? (
          <p className="mt-3 text-xs text-amber-200/95">
            {run.disclaimer_legal?.es || "Revisión por abogado autorizado requerida (Ley 91-2020)."}
          </p>
        ) : null}
      </div>

      {selected && run && !isError ? (
        <div
          className="space-y-4 border-t border-[var(--legal-border)] px-4 py-4"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          role="presentation"
        >
          <ActionToolbar content={content} run={run} onNewChat={onNewChat} />
          {citations.length > 0 ? (
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--legal-text-secondary)]">
                Fuentes citadas
              </h4>
              <div className="grid gap-3 md:grid-cols-2">
                {citations.map((c, idx) => (
                  <ResearchCitationCard
                    key={`${c.source_id}-${idx}`}
                    citation={c}
                    active={highlightSourceId === c.source_id}
                    onSelect={(id) => scrollToCitation(id, () => onHighlightSourceId(id))}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

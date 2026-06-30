"use client";

import type { Citation } from "@/types/legal";
import { trackEvent } from "@/lib/legal/telemetry";
import { citationDomId, formatArticleLabel } from "@/lib/legal/research/citation-utils";
import { cn } from "@/lib/utils";
import { toast } from "@/components/forge/ui/Toast";

type Props = {
  citation: Citation;
  active?: boolean;
  onSelect?: (sourceId: string) => void;
};

export function ResearchCitationCard({ citation, active, onSelect }: Props) {
  const verified = citation.layer === "capa_1";
  const domId = citationDomId(citation.source_id);

  return (
    <article
      id={domId}
      data-cite-id={domId}
      className={cn(
        "scroll-mt-24 rounded-lg border p-3 text-sm transition-shadow",
        verified
          ? "border-emerald-700/50 bg-emerald-950/30"
          : "border-amber-700/50 bg-amber-950/25",
        active && "ring-2 ring-[var(--legal-accent-strong)] legal-cite-glow",
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span
          className={cn(
            "rounded px-2 py-0.5 text-xs font-medium",
            verified ? "bg-emerald-900/80 text-emerald-100" : "bg-amber-900/80 text-amber-100",
          )}
        >
          {verified ? "Capa 1 · normativa verificada" : "Capa 2 · contexto bibliográfico"}
        </span>
        <button
          type="button"
          className="text-xs text-[var(--legal-accent)] underline"
          aria-label="Copiar identificador de fuente"
          onClick={() => {
            void navigator.clipboard.writeText(citation.source_id);
            toast.success("ID de fuente copiado");
            trackEvent("legal_citation_clicked", {
              law_name: citation.law_name,
              layer: citation.layer,
            });
          }}
        >
          Copiar ID
        </button>
      </div>
      <button
        type="button"
        className="w-full text-left"
        onClick={() => onSelect?.(citation.source_id)}
      >
        <p className="font-semibold text-zinc-100">{citation.law_name}</p>
        <p className="text-xs text-[var(--legal-text-secondary)]">{formatArticleLabel(citation.article)}</p>
        <blockquote className="mt-2 line-clamp-5 border-l-2 border-[var(--legal-border)] pl-2 text-[var(--legal-text-secondary)]">
          {citation.quote_or_summary}
        </blockquote>
      </button>
      <p className="mt-2 font-mono text-[10px] text-zinc-500">{citation.source_id}</p>
      {!verified ? (
        <p className="mt-2 text-xs text-amber-200/90">Capa 2: no constituye autoridad legal final.</p>
      ) : null}
    </article>
  );
}

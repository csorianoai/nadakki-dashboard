"use client";

import type { CSSProperties } from "react";
import type { Citation } from "@/types/legal";
import { citationDomId, formatArticleLabel } from "@/lib/legal/research/citation-utils";
import { CITATION_TIPO_META, resolveCitationTipo } from "@/lib/legal/research/citation-type";
import { toast } from "@/components/forge/ui/Toast";

type Props = {
  citation: Citation;
  requestId: string;
  highlighted?: boolean;
  onActivate?: () => void;
};

export function PapelCitationCard({ citation, requestId, highlighted, onActivate }: Props) {
  const tipo = resolveCitationTipo(citation);
  const meta = CITATION_TIPO_META[tipo];
  const domId = citationDomId(citation.source_id, requestId);

  return (
    <article
      id={domId}
      data-cite-id={domId}
      className={`lr-source-card${highlighted ? " lr-source-card--highlight" : ""}`}
      style={
        {
          "--lr-card-accent": meta.accent,
          "--lr-card-ring": meta.ring,
          borderColor: highlighted ? meta.bd : undefined,
        } as CSSProperties
      }
      role="button"
      tabIndex={0}
      aria-label={`Fuente ${meta.badge}: ${formatArticleLabel(citation.article)}`}
      onClick={onActivate}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onActivate?.();
        }
      }}
    >
      <div className="lr-source-badges">
        <span
          className="lr-source-badge"
          style={{ color: meta.text, background: meta.bg, borderColor: meta.bd }}
        >
          {meta.badge}
        </span>
        <span className="lr-source-tag">{meta.tag}</span>
      </div>
      <p className="lr-source-article">{formatArticleLabel(citation.article)}</p>
      <p className="lr-source-law">{citation.law_name}</p>
      <p className="lr-source-quote">{citation.quote_or_summary}</p>
      <div className="lr-source-footer">
        <span className="lr-source-id">{citation.source_id}</span>
        <button
          type="button"
          className="lr-btn-secondary"
          aria-label={`Copiar ID ${citation.source_id}`}
          onClick={(e) => {
            e.stopPropagation();
            void navigator.clipboard.writeText(citation.source_id);
            toast.success("ID copiado");
          }}
        >
          Copiar ID
        </button>
      </div>
    </article>
  );
}

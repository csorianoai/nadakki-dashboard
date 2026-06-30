"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Citation } from "@/types/legal";
import { findCitationByArticleRef, formatArticleLabel } from "@/lib/legal/research/citation-utils";
import { CITATION_TIPO_META, resolveCitationTipo } from "@/lib/legal/research/citation-type";

type Props = {
  content: string;
  citations?: Citation[];
  requestId?: string;
  onCitationClick?: (sourceId: string) => void;
  className?: string;
};

function renderTextWithCiteChips(
  text: string,
  citations: Citation[],
  onCitationClick?: (sourceId: string) => void,
): React.ReactNode {
  const parts = text.split(/(\[Art\.?\s*\d+[^\]]*\]|\[\d+\])/gi);
  return parts.map((part, i) => {
    const match = part.match(/^\[(.+)\]$/);
    if (!match) return part;
    const citation = findCitationByArticleRef(part, citations);
    if (!citation) return part;
    const tipo = resolveCitationTipo(citation);
    const isJuris = tipo === "jurisprudencia";
    return (
      <button
        key={`${part}-${i}`}
        type="button"
        className={`lr-cite-chip${isJuris ? " lr-cite-chip--juris" : ""}`}
        aria-label={`Ir a fuente ${formatArticleLabel(citation.article)}`}
        onClick={() => onCitationClick?.(citation.source_id)}
      >
        {formatArticleLabel(citation.article)}
      </button>
    );
  });
}

/** Renders markdown sections with styled code blocks and optional inline citation chips. */
export function ResearchMarkdown({ content, citations = [], onCitationClick, className }: Props) {
  return (
    <div className={`lr-markdown${className ? ` ${className}` : ""}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => {
            if (citations.length > 0 && typeof children === "string") {
              return <p>{renderTextWithCiteChips(children, citations, onCitationClick)}</p>;
            }
            if (Array.isArray(children)) {
              return (
                <p>
                  {children.map((child, idx) =>
                    typeof child === "string"
                      ? renderTextWithCiteChips(child, citations, onCitationClick)
                      : child,
                  )}
                </p>
              );
            }
            return <p>{children}</p>;
          },
          li: ({ children }) => {
            if (typeof children === "string" && citations.length > 0) {
              return <li>{renderTextWithCiteChips(children, citations, onCitationClick)}</li>;
            }
            return <li>{children}</li>;
          },
          pre: ({ children }) => <pre>{children}</pre>,
          code: ({ className: cn, children, ...props }) => {
            const isBlock = cn?.includes("language-");
            if (isBlock) return <code className={cn} {...props}>{children}</code>;
            return <code {...props}>{children}</code>;
          },
          a: ({ href, children }) => (
            <a href={href} rel="noopener noreferrer" target="_blank" style={{ color: "var(--lr-accent-ink)" }}>
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export function ResearchMarkdownList({ items }: { items: string[] }) {
  return (
    <ul className="lr-supuestos-grid">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

/** Detect markdown list items for grid rendering. */
export function extractListItems(markdown: string): string[] | null {
  const lines = markdown.trim().split("\n");
  const items: string[] = [];
  for (const line of lines) {
    const m = line.match(/^[-*]\s+(.+)$/) || line.match(/^\d+\.\s+(.+)$/);
    if (m) items.push(m[1].trim());
    else if (items.length > 0) return null;
  }
  return items.length > 0 ? items : null;
}

export { CITATION_TIPO_META, resolveCitationTipo };

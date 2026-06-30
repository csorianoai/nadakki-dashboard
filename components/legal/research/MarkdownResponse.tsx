"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Citation } from "@/types/legal";
import { citationDomId, formatArticleLabel } from "@/lib/legal/research/citation-utils";
import { cn } from "@/lib/utils";

const PROSE =
  "legal-research-markdown max-w-none text-sm leading-relaxed text-[var(--legal-text)] [&_a]:text-[var(--legal-accent)] [&_a]:underline [&_code]:rounded [&_code]:bg-zinc-800/80 [&_code]:px-1 [&_h1]:mb-3 [&_h1]:mt-4 [&_h1]:text-lg [&_h1]:font-semibold [&_h1]:text-[var(--legal-accent)] [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:border-l-2 [&_h2]:border-[var(--legal-accent-strong)] [&_h2]:pl-3 [&_h3]:mb-2 [&_h3]:mt-3 [&_h3]:text-sm [&_h3]:font-semibold [&_li]:my-1 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_strong]:font-semibold [&_strong]:text-zinc-100 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5";

type Props = {
  content: string;
  citations?: Citation[];
  onCitationClick?: (sourceId: string) => void;
  className?: string;
};

/** Renders assistant respuesta as markdown (react-markdown + GFM, no raw HTML). */
export function MarkdownResponse({ content, citations, onCitationClick, className }: Props) {
  return (
    <div className={cn(PROSE, className)}>
      {citations && citations.length > 0 ? (
        <nav
          className="mb-4 flex flex-wrap gap-2 border-b border-[var(--legal-border)] pb-3"
          aria-label="Ir a cita normativa"
        >
          {citations.map((c) => (
            <button
              key={c.source_id}
              type="button"
              data-cite-id={citationDomId(c.source_id)}
              className="rounded-full border border-[var(--legal-border)] bg-[var(--legal-surface-1)] px-2.5 py-1 text-xs text-[var(--legal-text-secondary)] transition hover:border-[var(--legal-accent-strong)] hover:text-[var(--legal-accent)]"
              onClick={() => onCitationClick?.(c.source_id)}
            >
              {c.law_name.slice(0, 40)}
              {c.law_name.length > 40 ? "…" : ""} · {formatArticleLabel(c.article)}
            </button>
          ))}
        </nav>
      ) : null}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => {
            if (href?.startsWith("#cite-")) {
              const id = href.slice(1);
              return (
                <button
                  type="button"
                  className="font-medium text-[var(--legal-accent)] underline"
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById(id);
                    el?.scrollIntoView({ behavior: "smooth", block: "center" });
                    el?.classList.add("legal-cite-glow");
                    window.setTimeout(() => el?.classList.remove("legal-cite-glow"), 2200);
                  }}
                >
                  {children}
                </button>
              );
            }
            return (
              <a href={href} rel="noopener noreferrer" target="_blank">
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

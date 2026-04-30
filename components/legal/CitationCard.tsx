"use client";

import type { Citation } from "@/types/legal";
import { trackEvent } from "@/lib/legal/telemetry";
import { cn } from "@/lib/utils";

export function CitationCard({ citation }: { citation: Citation }) {
  const verified = citation.layer === "capa_1";
  return (
    <article
      className={cn(
        "rounded-lg border p-3 text-sm",
        verified
          ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40"
          : "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40"
      )}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <span
          className={cn(
            "rounded px-2 py-0.5 text-xs font-medium",
            verified
              ? "bg-emerald-200 text-emerald-950 dark:bg-emerald-900 dark:text-emerald-100"
              : "bg-amber-200 text-amber-950 dark:bg-amber-900 dark:text-amber-100"
          )}
        >
          {verified ? "Fuente normativa verificada" : "Contexto bibliográfico"}
        </span>
        <button
          type="button"
          className="text-xs text-blue-600 underline dark:text-blue-400"
          aria-label="Copiar identificador de fuente"
          onClick={() => {
            void navigator.clipboard.writeText(citation.source_id);
            trackEvent("legal_citation_clicked", {
              law_name: citation.law_name,
              layer: citation.layer,
            });
          }}
        >
          Copiar ID
        </button>
      </div>
      <p className="font-semibold text-slate-900 dark:text-slate-100">{citation.law_name}</p>
      <p className="text-xs text-slate-600 dark:text-slate-400">Art. {citation.article}</p>
      <blockquote className="mt-2 line-clamp-4 border-l-2 border-slate-300 pl-2 text-slate-700 dark:border-slate-600 dark:text-slate-300">
        {citation.quote_or_summary}
      </blockquote>
      <p className="mt-1 font-mono text-[10px] text-slate-500 dark:text-slate-500">{citation.source_id}</p>
      {!verified && (
        <p className="mt-2 text-xs text-amber-800 dark:text-amber-200">
          Capa 2: no constituye autoridad legal final.
        </p>
      )}
    </article>
  );
}

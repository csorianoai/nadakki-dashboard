"use client";

import type { CompetitorItem } from "@/types/spyfu";

function domainOf(c: CompetitorItem) {
  return String(c.domain ?? c.competitor_domain ?? c.name ?? "—");
}

export function CompetitorsList({
  title,
  items,
}: {
  title: string;
  items: CompetitorItem[];
}) {
  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-900/40 p-3">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </h4>
      <ul className="max-h-64 space-y-1.5 overflow-y-auto text-sm text-slate-200" aria-label={title}>
        {items.length === 0 ? (
          <li className="text-slate-500">—</li>
        ) : (
          items.map((c, i) => (
            <li
              key={`${domainOf(c)}-${i}`}
              className="flex justify-between gap-2 rounded-lg border border-slate-800/50 bg-slate-950/40 px-2 py-1.5"
            >
              <span className="truncate font-medium text-cyan-200/90">{domainOf(c)}</span>
              {c.overlap !== undefined ? (
                <span className="shrink-0 text-[10px] text-slate-500">
                  overlap: {String(c.overlap)}
                </span>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

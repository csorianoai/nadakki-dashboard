"use client";

import type { Finding } from "../lib/types";

function confidenceTone(confidence: string): string {
  const c = confidence.toLowerCase();
  if (c === "high") return "bg-forgeSuccess-50 text-forgeSuccess-700 border-forgeSuccess-500/30";
  if (c === "medium") return "bg-forgeWarning-50 text-forgeWarning-700 border-forgeWarning-500/30";
  return "bg-forgeGray-100 text-forgeGray-600 border-forgeGray-200";
}

function tierTone(tier: string): string {
  if (tier === "T1") return "border-[var(--mee-tier-1)] text-[var(--mee-tier-1)]";
  if (tier === "T2") return "border-[var(--mee-tier-2)] text-[var(--mee-tier-2)]";
  return "border-[var(--mee-tier-3)] text-[var(--mee-tier-3)]";
}

export function SourcesList({ findings }: { findings: Finding[] }) {
  if (!findings.length) return null;

  return (
    <section
      className="rounded-forge-lg border border-forgeGray-200 bg-forgeSurface-card p-4 shadow-forge-xs"
      aria-labelledby="sources-list-title"
    >
      <h3 id="sources-list-title" className="font-display text-forge-md font-semibold text-forgeGray-800">
        Fuentes analizadas
      </h3>
      <ul className="mt-3 divide-y divide-forgeGray-100">
        {findings.map((f) => (
          <li key={`${f.source_name}-${f.category}`} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-forgeGray-800">{f.source_name}</p>
              <p className="mt-0.5 text-forge-sm text-forgeGray-600">{f.summary}</p>
              <p className="mt-1 text-forge-xs text-forgeGray-500">
                {f.source_level} · {f.category}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-1.5">
              <span
                className={`rounded-forge-pill border px-2 py-0.5 text-forge-xs font-semibold ${tierTone(f.tier)}`}
              >
                {f.tier}
              </span>
              <span
                className={`rounded-forge-pill border px-2 py-0.5 text-forge-xs font-semibold ${confidenceTone(f.confidence)}`}
              >
                {f.confidence}
              </span>
              {f.source_level === "operator_upload" ? (
                <span className="rounded-forge-pill border border-[var(--mee-accent)]/40 bg-[var(--mee-accent-soft)] px-2 py-0.5 text-forge-xs font-semibold text-[var(--mee-accent-strong)]">
                  operator_upload
                </span>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

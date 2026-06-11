"use client";

import { Scale } from "lucide-react";
import type { Finding } from "../lib/types";

export function FindingsPanel({ findings }: { findings: Finding[] }) {
  if (!findings.length) return null;

  const counselBlocked = findings.filter((f) => f.requires_counsel_review);

  return (
    <section
      className="rounded-forge-lg border border-forgeGray-200 bg-forgeSurface-card p-4 shadow-forge-xs"
      aria-labelledby="findings-panel-title"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="findings-panel-title" className="font-display text-forge-md font-semibold text-forgeGray-800">
          Hallazgos
        </h3>
        {counselBlocked.length > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-forge-pill border border-forgeWarning-500/40 bg-forgeWarning-50 px-2 py-0.5 text-forge-xs font-semibold text-forgeWarning-700">
            <Scale className="h-3 w-3" aria-hidden />
            {counselBlocked.length} requiere(n) counsel
          </span>
        ) : null}
      </div>

      <ul className="mt-3 space-y-3">
        {findings.map((f) => (
          <li
            key={`finding-${f.source_name}-${f.category}`}
            className={`rounded-forge-md border p-3 ${
              f.requires_counsel_review
                ? "border-forgeWarning-500/50 bg-forgeWarning-50/80 ring-1 ring-forgeWarning-500/20"
                : "border-forgeGray-200 bg-forgeSurface-sunken"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="font-medium text-forgeGray-800">{f.category.replace(/_/g, " ")}</p>
              {f.requires_counsel_review ? (
                <span className="inline-flex items-center gap-1 rounded-forge-sm bg-forgeWarning-500/15 px-2 py-0.5 text-forge-xs font-bold uppercase tracking-wide text-forgeWarning-700">
                  <Scale className="h-3 w-3" aria-hidden />
                  Revisión counsel
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-forge-sm text-forgeGray-600">{f.summary}</p>
            {f.data_points?.length ? (
              <ul className="mt-2 flex flex-wrap gap-2">
                {f.data_points.map((dp, i) => {
                  const metric =
                    typeof dp.metric === "string" ? dp.metric : `punto_${i + 1}`;
                  const value = dp.value != null ? String(dp.value) : "—";
                  return (
                    <li
                      key={`${metric}-${i}`}
                      className="rounded-forge-sm border border-forgeGray-200 bg-white px-2 py-1 font-forgeMono text-forge-xs text-forgeGray-700"
                    >
                      {metric}: {value}
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

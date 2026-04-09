"use client";

import type { NarrativeResult } from "@/lib/credit-api";

export interface NarrativeCardProps {
  narrative: NarrativeResult | null;
  role: "dealer" | "bank" | "client";
  loading?: boolean;
}

function badgeClass(label: NarrativeResult["confidence_label"]): string {
  switch (label) {
    case "ALTA":
      return "bg-emerald-200/90 text-emerald-900";
    case "MEDIA":
      return "bg-amber-200/90 text-amber-900";
    case "BAJA":
      return "bg-red-200/90 text-red-900";
    default:
      return "bg-slate-600 text-slate-200";
  }
}

export function NarrativeCard({
  narrative,
  role,
  loading,
}: NarrativeCardProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
        <div className="h-4 w-40 rounded bg-slate-600/50 animate-pulse" />
        <div className="h-24 rounded bg-slate-600/40 animate-pulse" />
        <div className="h-24 rounded bg-slate-600/30 animate-pulse" />
      </div>
    );
  }

  if (!narrative) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm text-slate-500 m-0">Análisis en proceso…</p>
      </div>
    );
  }

  const text =
    role === "dealer"
      ? (narrative.dealer_narrative ?? "")
      : role === "bank"
        ? (narrative.bank_narrative ?? "")
        : (narrative.client_narrative ?? "");

  const paragraphs =
    text?.split(/\n\n+/).filter((p) => p.trim().length > 0) ?? [];

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <h3 className="text-sm font-medium text-slate-200 m-0">
          Narrativa{" "}
          <span className="text-slate-500 font-normal capitalize">({role})</span>
        </h3>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded ${badgeClass(
            (narrative.confidence_label ?? "MEDIA") as NarrativeResult["confidence_label"]
          )}`}
        >
          {narrative.confidence_label ?? "—"}
        </span>
      </div>
      <div className="space-y-3 text-sm text-slate-300">
        {paragraphs.length > 0 ? (
          paragraphs.map((p, i) => (
            <p key={i} className="m-0 leading-relaxed whitespace-pre-wrap">
              {p.trim()}
            </p>
          ))
        ) : (
          <p className="text-slate-500 m-0">Sin texto de narrativa.</p>
        )}
      </div>
    </div>
  );
}

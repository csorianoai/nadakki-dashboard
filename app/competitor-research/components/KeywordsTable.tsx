"use client";

import { useState } from "react";
import type { UILang } from "@/lib/i18n/competitor-research";
import { crStrings } from "@/lib/i18n/competitor-research";
import type { KeywordItem } from "@/types/spyfu";
import clsx from "clsx";

function kwText(k: KeywordItem) {
  return String(k.keyword ?? k.term ?? "—");
}

export function KeywordsTable({
  paid,
  organic,
  lang,
}: {
  paid: KeywordItem[];
  organic: KeywordItem[];
  lang: UILang;
}) {
  const t = crStrings(lang);
  const [mode, setMode] = useState<"paid" | "organic">("paid");
  const rows = mode === "paid" ? paid : organic;
  const label =
    mode === "paid"
      ? `${t.paidKeywords} (${paid.length})`
      : `${t.organicKeywords} (${organic.length})`;

  return (
    <div className="rounded-xl border border-slate-700/60">
      <div className="flex gap-1 border-b border-slate-700/60 p-2">
        <button
          type="button"
          className={clsx(
            "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
            mode === "paid"
              ? "bg-cyan-500/20 text-cyan-200"
              : "text-slate-400 hover:bg-slate-800"
          )}
          onClick={() => setMode("paid")}
        >
          {t.paidKeywords} ({paid.length})
        </button>
        <button
          type="button"
          className={clsx(
            "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
            mode === "organic"
              ? "bg-cyan-500/20 text-cyan-200"
              : "text-slate-400 hover:bg-slate-800"
          )}
          onClick={() => setMode("organic")}
        >
          {t.organicKeywords} ({organic.length})
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-xs text-slate-200">
          <caption className="sr-only">{label}</caption>
          <thead>
            <tr className="border-b border-slate-700/80 bg-slate-900/80 text-[10px] uppercase tracking-wide text-slate-500">
              <th className="p-2">{t.colKeyword}</th>
              <th className="p-2">{t.colVolume}</th>
              <th className="p-2">{t.colCpc}</th>
              <th className="p-2">{t.colDifficulty}</th>
              <th className="p-2">{t.colRank}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-slate-500">
                  —
                </td>
              </tr>
            ) : (
              rows.map((k, i) => (
                <tr key={`${mode}-${i}`} className="border-b border-slate-800/60 hover:bg-slate-800/20">
                  <td className="p-2 font-medium">{kwText(k)}</td>
                  <td className="p-2 text-slate-400">{k.search_volume ?? k.volume ?? "—"}</td>
                  <td className="p-2 text-slate-400">{k.cpc ?? "—"}</td>
                  <td className="p-2 text-slate-400">{k.difficulty ?? "—"}</td>
                  <td className="p-2 text-slate-400">{k.rank ?? k.position ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

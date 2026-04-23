"use client";

import type { UILang } from "@/lib/i18n/competitor-research";
import { crStrings } from "@/lib/i18n/competitor-research";

export function CompetitorOverviewCard({
  domain,
  overview,
  lang,
}: {
  domain: string;
  overview: {
    monthlyBudget: number | null;
    paidClicks: number | null;
    strength: number | null;
    rank: number | null;
  };
  lang: UILang;
}) {
  const t = crStrings(lang);
  const fmt = (n: number | null) => (n === null || Number.isNaN(n) ? "—" : String(n));

  return (
    <div className="rounded-xl border border-cyan-500/25 bg-gradient-to-br from-slate-900/90 to-slate-950/90 p-4 shadow-lg">
      <h3 className="mb-3 text-sm font-semibold text-cyan-200/90">{domain}</h3>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-slate-500">{t.monthlyBudget}</div>
          <div className="text-lg font-bold text-slate-100">{fmt(overview.monthlyBudget)}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wide text-slate-500">{t.paidClicks}</div>
          <div className="text-lg font-bold text-slate-100">{fmt(overview.paidClicks)}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wide text-slate-500">{t.strength}</div>
          <div className="text-lg font-bold text-slate-100">{fmt(overview.strength)}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wide text-slate-500">{t.rank}</div>
          <div className="text-lg font-bold text-slate-100">{fmt(overview.rank)}</div>
        </div>
      </div>
    </div>
  );
}

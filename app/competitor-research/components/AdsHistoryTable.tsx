"use client";

import { Fragment, useState } from "react";
import type { UILang } from "@/lib/i18n/competitor-research";
import { crStrings } from "@/lib/i18n/competitor-research";
import type { AdItem } from "@/types/spyfu";
import { ChevronDown, ChevronRight } from "lucide-react";

function adDate(a: AdItem) {
  return String(a.date ?? a.ad_date ?? "—");
}
function adTitle(a: AdItem) {
  return String(a.title ?? a.ad_title ?? "—");
}
function adBody(a: AdItem) {
  return String(a.body ?? a.description ?? a.ad_body ?? "");
}
function adKw(a: AdItem) {
  const k = a.keywords ?? a.keyword;
  if (Array.isArray(k)) return k.join(", ");
  return String(k ?? "—");
}
function adUrl(a: AdItem) {
  return String(a.url ?? a.landing_url ?? "—");
}
function adPos(a: AdItem) {
  const p = a.position ?? a.ad_position;
  return p === undefined || p === null ? "—" : String(p);
}

function truncate(s: string, n: number) {
  if (s.length <= n) return s;
  return `${s.slice(0, n)}…`;
}

export function AdsHistoryTable({ ads, lang }: { ads: AdItem[]; lang: UILang }) {
  const t = crStrings(lang);
  const [open, setOpen] = useState<Record<number, boolean>>({});

  if (ads.length === 0) {
    return (
      <p className="rounded-lg border border-slate-700/60 bg-slate-900/40 p-4 text-sm text-slate-500">
        {t.noAds}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-700/60">
      <table className="w-full min-w-[720px] border-collapse text-left text-xs text-slate-200">
        <thead>
          <tr className="border-b border-slate-700/80 bg-slate-900/80 text-[10px] uppercase tracking-wide text-slate-500">
            <th className="w-8 p-2" aria-hidden />
            <th className="p-2">{t.colDate}</th>
            <th className="p-2">{t.colPosition}</th>
            <th className="p-2">{t.colTitle}</th>
            <th className="p-2">{t.colBody}</th>
            <th className="p-2">{t.colKeywords}</th>
            <th className="p-2">{t.colUrl}</th>
          </tr>
        </thead>
        <tbody>
          {ads.map((row, i) => {
            const isOpen = !!open[i];
            const body = adBody(row);
            return (
              <Fragment key={`ad-${i}`}>
                <tr className="border-b border-slate-800/80 hover:bg-slate-800/30">
                  <td className="p-1 align-top">
                    <button
                      type="button"
                      className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-cyan-300"
                      aria-expanded={isOpen}
                      aria-label={isOpen ? t.collapse : t.expand}
                      onClick={() => setOpen((s) => ({ ...s, [i]: !isOpen }))}
                    >
                      {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                  </td>
                  <td className="p-2 align-top text-slate-400">{adDate(row)}</td>
                  <td className="p-2 align-top">{adPos(row)}</td>
                  <td className="p-2 align-top font-medium">{adTitle(row)}</td>
                  <td className="max-w-[200px] p-2 align-top text-slate-400">
                    {truncate(body, 80)}
                  </td>
                  <td className="max-w-[140px] p-2 align-top text-slate-400">{adKw(row)}</td>
                  <td className="max-w-[160px] truncate p-2 align-top text-cyan-300/80">{adUrl(row)}</td>
                </tr>
                {isOpen ? (
                  <tr className="bg-slate-950/50">
                    <td colSpan={7} className="p-3 text-sm text-slate-300">
                      <div className="whitespace-pre-wrap">{body || "—"}</div>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

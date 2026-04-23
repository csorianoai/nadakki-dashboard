"use client";

import type { UsageView } from "@/hooks/useSpyFuUsage";
import type { UILang } from "@/lib/i18n/competitor-research";
import { crStrings } from "@/lib/i18n/competitor-research";
import clsx from "clsx";

function barColor(pct: number) {
  if (pct > 80) return "bg-red-500";
  if (pct >= 60) return "bg-amber-400";
  return "bg-emerald-500";
}

export function UsageWidget({ usage, lang }: { usage: UsageView | null; lang: UILang }) {
  const t = crStrings(lang);
  if (!usage) {
    return (
      <div className="rounded-xl border border-slate-700/80 bg-slate-900/50 px-3 py-2 text-xs text-slate-500">
        …
      </div>
    );
  }
  const cap = typeof usage.rows_cap === "number" ? usage.rows_cap : 0;
  const used = typeof usage.rows_used === "number" ? usage.rows_used : 0;
  const pct =
    typeof usage.percent_used === "number"
      ? usage.percent_used
      : cap > 0
        ? Math.min(100, Math.round((used / cap) * 1000) / 10)
        : 0;
  const cost =
    typeof usage.cost_estimate_usd === "number"
      ? usage.cost_estimate_usd.toFixed(2)
      : "—";
  const cachePct =
    usage.cache_hit_rate_pct !== null && usage.cache_hit_rate_pct !== undefined
      ? String(usage.cache_hit_rate_pct)
      : "—";

  return (
    <div
      className="min-w-[200px] max-w-[280px] rounded-xl border border-slate-700/80 bg-slate-900/60 px-3 py-2 text-[11px] text-slate-300 shadow-lg backdrop-blur-sm"
      aria-live="polite"
    >
      <div className="mb-1 font-semibold text-slate-200">SpyFu usage</div>
      <div className="mb-1">
        {t.usageRows(String(used), String(cap || "—"), String(pct))}
      </div>
      <div
        className="mb-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-800"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={clsx("h-full rounded-full transition-all", barColor(pct))}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <div className="text-slate-400">{t.usageCost(cost)}</div>
      <div className="text-slate-400">{t.usageCache(cachePct)}</div>
    </div>
  );
}

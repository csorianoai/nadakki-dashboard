"use client";

import { useEffect, useState } from "react";
import { useDeepAnalysis } from "@/hooks/useDeepAnalysis";
import { useTenant } from "@/contexts/TenantContext";
import { domainStatsSummary } from "@/lib/spyfu/normalize";
import type { UILang } from "@/lib/i18n/competitor-research";
import { crStrings } from "@/lib/i18n/competitor-research";
import type { CompetitorAnalysisData, DomainStatsResponse } from "@/types/spyfu";
import { BudgetExceededError, FeatureDisabledError } from "@/types/spyfu";
import { AdsHistoryTable } from "./AdsHistoryTable";
import { CompetitorOverviewCard } from "./CompetitorOverviewCard";
import { CompetitorsList } from "./CompetitorsList";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { CountrySelector } from "./CountrySelector";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import toast from "react-hot-toast";
import { ScanSearch } from "lucide-react";

function chartFromOverview(overview: ReturnType<typeof domainStatsSummary>) {
  return [
    { name: "budget", v: overview.monthlyBudget ?? 0 },
    { name: "clicks", v: overview.paidClicks ?? 0 },
    { name: "strength", v: overview.strength ?? 0 },
    { name: "rank", v: overview.rank ?? 0 },
  ];
}

function SkeletonDeep() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-8 w-48 rounded bg-slate-800/60" />
      <div className="h-40 rounded-xl bg-slate-800/60" />
      <div className="h-32 rounded-xl bg-slate-800/60" />
    </div>
  );
}

export function DeepAnalysisTab({ lang }: { lang: UILang }) {
  const t = crStrings(lang);
  const { tenantId } = useTenant();
  const { loading, error, envelope, analyze } = useDeepAnalysis();
  const [domain, setDomain] = useState("");
  const [country, setCountry] = useState("US");

  useEffect(() => {
    if (error) {
      if (error instanceof BudgetExceededError) toast.error(t.budgetExceeded);
      else if (error instanceof FeatureDisabledError) toast.error(t.featureDisabled);
      else toast.error(error.message);
    }
  }, [error, t.budgetExceeded, t.featureDisabled]);

  const data: CompetitorAnalysisData | undefined = envelope?.data;
  const overview = domainStatsSummary(
    data?.domain_stats as DomainStatsResponse | undefined
  );
  const paid = data?.paid_keywords ?? [];
  const organic = data?.organic_keywords ?? [];
  const ads = data?.ads ?? [];
  const ppc = data?.ppc_competitors ?? [];
  const seo = data?.seo_competitors ?? [];
  const meta = envelope?.meta;
  const conf = envelope?.confidence;

  return (
    <div className="space-y-6">
      <p className="text-xs text-slate-500">{t.deepRunHint}</p>
      <form
        className="flex flex-col gap-3 rounded-xl border border-slate-700/50 bg-slate-900/30 p-4 md:flex-row md:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          analyze(domain, country, tenantId);
        }}
      >
        <div className="flex-1">
          <label htmlFor="deep-domain" className="mb-1 block text-xs font-medium text-slate-400">
            {t.domainLabel}
          </label>
          <input
            id="deep-domain"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder={t.domainPlaceholder}
            className="w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500/60"
          />
        </div>
        <CountrySelector value={country} onChange={setCountry} lang={lang} id="deep-country" />
        <button
          type="submit"
          disabled={loading || !domain.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600/90 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-40"
        >
          <ScanSearch size={16} />
          {t.runAnalysis}
        </button>
      </form>

      {loading ? (
        <div>
          <p className="mb-3 text-sm text-cyan-200/80">
            {t.analyzing(domain.trim() || "…")}
          </p>
          <SkeletonDeep />
        </div>
      ) : null}

      {error && !(error instanceof BudgetExceededError) ? (
        <p className="text-sm text-red-400" role="alert">
          {error instanceof FeatureDisabledError ? t.featureDisabled : error.message}
        </p>
      ) : null}

      {error instanceof BudgetExceededError ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100">
          {t.budgetExceeded}
        </p>
      ) : null}

      {envelope && !loading ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            {conf?.overall ? <ConfidenceBadge level={conf.overall} /> : null}
            <span className="text-[11px] text-slate-500">
              {t.costFooter(
                String(meta?.cost_estimate ?? "—"),
                meta?.cache_hit ? "HIT" : "MISS",
                String(meta?.fetched_at ?? "—")
              )}
            </span>
          </div>

          <CompetitorOverviewCard domain={domain.trim()} overview={overview} lang={lang} />

          <div className="h-48 rounded-xl border border-slate-700/50 bg-slate-900/40 p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartFromOverview(overview)}>
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "1px solid #334155" }}
                  labelStyle={{ color: "#e2e8f0" }}
                />
                <Bar dataKey="v" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-slate-700/50 bg-slate-900/30 p-3">
              <div className="text-xs font-semibold text-slate-400">{t.paidKeywords}</div>
              <div className="text-2xl font-bold text-slate-100">{paid.length}</div>
            </div>
            <div className="rounded-xl border border-slate-700/50 bg-slate-900/30 p-3">
              <div className="text-xs font-semibold text-slate-400">{t.organicKeywords}</div>
              <div className="text-2xl font-bold text-slate-100">{organic.length}</div>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-200">{t.topAds}</h3>
            <AdsHistoryTable ads={ads.slice(0, 5)} lang={lang} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <CompetitorsList title={`${t.ppcCompetitors} (${ppc.length})`} items={ppc} />
            <CompetitorsList title={`${t.seoCompetitors} (${seo.length})`} items={seo} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

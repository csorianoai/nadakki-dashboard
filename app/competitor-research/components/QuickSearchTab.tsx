"use client";

import { useEffect, useState } from "react";
import { useCompetitorSearch } from "@/hooks/useCompetitorSearch";
import { useTenant } from "@/contexts/TenantContext";
import type { UILang } from "@/lib/i18n/competitor-research";
import { crStrings } from "@/lib/i18n/competitor-research";
import { AdsHistoryTable } from "./AdsHistoryTable";
import { CompetitorOverviewCard } from "./CompetitorOverviewCard";
import { CompetitorsList } from "./CompetitorsList";
import { CountrySelector } from "./CountrySelector";
import { KeywordsTable } from "./KeywordsTable";
import toast from "react-hot-toast";
import { Search } from "lucide-react";

function SkeletonBlock() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-24 rounded-xl bg-slate-800/60" />
      <div className="h-40 rounded-xl bg-slate-800/60" />
      <div className="h-48 rounded-xl bg-slate-800/60" />
    </div>
  );
}

export function QuickSearchTab({ lang }: { lang: UILang }) {
  const t = crStrings(lang);
  const { tenantId } = useTenant();
  const { loading, error, result, search } = useCompetitorSearch();
  const [domain, setDomain] = useState("");
  const [country, setCountry] = useState("US");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    search(domain, country, tenantId);
  };

  useEffect(() => {
    if (error) toast.error(error.message);
  }, [error]);

  return (
    <div className="space-y-6">
      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-3 rounded-xl border border-slate-700/50 bg-slate-900/30 p-4 md:flex-row md:items-end"
      >
        <div className="flex-1">
          <label htmlFor="qs-domain" className="mb-1 block text-xs font-medium text-slate-400">
            {t.domainLabel}
          </label>
          <input
            id="qs-domain"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder={t.domainPlaceholder}
            className="w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500/60"
            autoComplete="off"
          />
        </div>
        <CountrySelector value={country} onChange={setCountry} lang={lang} id="qs-country" />
        <button
          type="submit"
          disabled={loading || !domain.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-600/90 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 disabled:opacity-40"
        >
          <Search size={16} />
          {t.search}
        </button>
      </form>

      {error ? (
        <p className="text-sm text-red-400" role="alert">
          {error.message}
        </p>
      ) : null}

      {loading ? <SkeletonBlock /> : null}

      {!loading && !result ? (
        <p className="text-center text-sm text-slate-500">{t.startPrompt}</p>
      ) : null}

      {result ? (
        <div className="space-y-6">
          <CompetitorOverviewCard domain={domain.trim()} overview={result.overview} lang={lang} />
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-200">{t.adsHistory}</h3>
            <AdsHistoryTable ads={result.ads} lang={lang} />
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-200">{t.keywordsSummary}</h3>
            <KeywordsTable
              paid={result.paidKeywords}
              organic={result.organicKeywords}
              lang={lang}
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <CompetitorsList
              title={`${t.ppcCompetitors} (${result.ppcCompetitors.length})`}
              items={result.ppcCompetitors}
            />
            <CompetitorsList
              title={`${t.seoCompetitors} (${result.seoCompetitors.length})`}
              items={result.seoCompetitors}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

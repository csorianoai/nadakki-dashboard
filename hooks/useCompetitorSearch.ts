"use client";

import { useCallback, useState } from "react";
import { spyfu } from "@/lib/api/spyfu-client";
import {
  adsListFromResponse,
  competitorsList,
  domainStatsSummary,
  keywordsSplit,
} from "@/lib/spyfu/normalize";
import type {
  AdItem,
  CompetitorItem,
  DomainStatsResponse,
  KeywordItem,
} from "@/types/spyfu";

export interface QuickSearchResult {
  ads: AdItem[];
  paidKeywords: KeywordItem[];
  organicKeywords: KeywordItem[];
  ppcCompetitors: CompetitorItem[];
  seoCompetitors: CompetitorItem[];
  domainStatsRaw: DomainStatsResponse | null;
  overview: ReturnType<typeof domainStatsSummary>;
}

export function useCompetitorSearch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<QuickSearchResult | null>(null);

  const search = useCallback(
    async (domain: string, countryCode: string, tenantId: string | null) => {
      const d = domain.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0];
      if (!d) {
        setError(new Error("empty_domain"));
        setResult(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const [adsRes, kwRes, ppcRes, seoRes, statsRes] = await Promise.all([
          spyfu.getAds(d, countryCode, tenantId),
          spyfu.getKeywords(d, countryCode, tenantId),
          spyfu.getCompetitors(d, countryCode, tenantId),
          spyfu.getSeoCompetitors(d, countryCode, 10, tenantId),
          spyfu.getDomainStatsAll(d, countryCode, tenantId),
        ]);
        const { paid, organic } = keywordsSplit(kwRes);
        setResult({
          ads: adsListFromResponse(adsRes),
          paidKeywords: paid,
          organicKeywords: organic,
          ppcCompetitors: competitorsList(ppcRes),
          seoCompetitors: competitorsList(seoRes),
          domainStatsRaw: statsRes,
          overview: domainStatsSummary(statsRes),
        });
      } catch (e) {
        setResult(null);
        setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { loading, error, result, search };
}

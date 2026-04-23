"use client";

import { useCallback, useState } from "react";
import { spyfu } from "@/lib/api/spyfu-client";
import type { CompetitorAnalysisData, IntelligenceEnvelope } from "@/types/spyfu";

export function useDeepAnalysis() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [envelope, setEnvelope] = useState<IntelligenceEnvelope<CompetitorAnalysisData> | null>(
    null
  );

  const analyze = useCallback(
    async (domain: string, countryCode: string, tenantId: string | null) => {
      const d = domain.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0];
      if (!d) {
        setError(new Error("empty_domain"));
        setEnvelope(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await spyfu.analyzeCompetitor(d, countryCode, tenantId);
        setEnvelope(res);
      } catch (e) {
        setEnvelope(null);
        setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { loading, error, envelope, analyze };
}

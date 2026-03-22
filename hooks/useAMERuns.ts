"use client";

import { useEffect, useState } from "react";
import { fetchWithFallback, type FetchSource } from "@/lib/api/client";
import { AME_ENDPOINTS } from "@/lib/api/endpoints";
import { FALLBACK_AME_RUNS, type AMERunsData } from "@/lib/fallbacks/ame";

export function useAMERuns(tenantId: string | null | undefined, refreshKey = 0) {
  const [data, setData] = useState<AMERunsData>(FALLBACK_AME_RUNS);
  const [source, setSource] = useState<FetchSource>("fallback");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    let cancelled = false;
    const url = AME_ENDPOINTS.RUNS ? `${AME_ENDPOINTS.RUNS}?limit=10` : "";
    (async () => {
      setLoading(true);
      setError(null);
      const res = await fetchWithFallback<AMERunsData>(url, {
        tenantId: tenantId?.trim() || undefined,
        fallbackData: FALLBACK_AME_RUNS,
        signal: ac.signal,
      });
      if (cancelled) return;
      if (res.error === "AbortError") return;
      setData(res.data);
      setSource(res.source);
      setError(res.error);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [tenantId, refreshKey]);

  return { data, source, loading, error };
}

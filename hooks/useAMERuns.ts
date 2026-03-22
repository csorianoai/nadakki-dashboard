"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchWithFallback, type FetchSource } from "@/lib/api/client";
import { AME_ENDPOINTS } from "@/lib/api/endpoints";
import { FALLBACK_AME_RUNS } from "@/lib/fallbacks/ame";

export type AMERunsShape = typeof FALLBACK_AME_RUNS;

export function useAMERuns(tenantIdForHeader?: string | null) {
  const [data, setData] = useState<AMERunsShape>(FALLBACK_AME_RUNS);
  const [source, setSource] = useState<FetchSource>("fallback");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      const tid = tenantIdForHeader?.trim() || undefined;
      const url = AME_ENDPOINTS.RUNS
        ? `${AME_ENDPOINTS.RUNS}?limit=10`
        : "";
      const res = await fetchWithFallback<AMERunsShape>(url, {
        tenantId: tid,
        fallbackData: FALLBACK_AME_RUNS,
        signal,
      });
      setData(res.data);
      setSource(res.source);
      setError(res.error);
      setLoading(false);
    },
    [tenantIdForHeader]
  );

  useEffect(() => {
    const ac = new AbortController();
    void load(ac.signal);
    return () => ac.abort();
  }, [load]);

  return { data, source, loading, error, refetch: load };
}

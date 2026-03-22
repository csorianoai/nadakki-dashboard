"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchWithFallback, type FetchSource } from "@/lib/api/client";
import { AME_ENDPOINTS } from "@/lib/api/endpoints";
import { FALLBACK_AME_STATUS } from "@/lib/fallbacks/ame";

export type AMEStatusShape = typeof FALLBACK_AME_STATUS;

export function useAMEStatus(tenantIdForHeader?: string | null) {
  const [data, setData] = useState<AMEStatusShape>(FALLBACK_AME_STATUS);
  const [source, setSource] = useState<FetchSource>("fallback");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      const tid = tenantIdForHeader?.trim() || undefined;
      const res = await fetchWithFallback<AMEStatusShape>(AME_ENDPOINTS.STATUS, {
        tenantId: tid,
        fallbackData: FALLBACK_AME_STATUS,
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

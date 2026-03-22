"use client";

import { useEffect, useState } from "react";
import { fetchWithFallback, type FetchSource } from "@/lib/api/client";
import { AME_ENDPOINTS } from "@/lib/api/endpoints";
import { FALLBACK_AME_STATUS, type AMEStatusData } from "@/lib/fallbacks/ame";

export function useAMEStatus(tenantId: string | null | undefined, refreshKey = 0) {
  const [data, setData] = useState<AMEStatusData>(FALLBACK_AME_STATUS);
  const [source, setSource] = useState<FetchSource>("fallback");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const res = await fetchWithFallback<AMEStatusData>(AME_ENDPOINTS.STATUS, {
        tenantId: tenantId?.trim() || undefined,
        fallbackData: FALLBACK_AME_STATUS,
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

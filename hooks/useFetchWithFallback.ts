"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchWithFallback,
  type FetchSource,
} from "@/lib/api/client";

export type UseFetchWithFallbackResult<T> = {
  data: T;
  source: FetchSource;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

/**
 * Client hook wrapping lib/api/client fetchWithFallback.
 * Pass stable `fallbackData` (e.g. imported constants) to avoid effect loops.
 */
export function useFetchWithFallback<T>(
  url: string,
  options: { tenantId?: string | null; fallbackData: T }
): UseFetchWithFallbackResult<T> {
  const { tenantId, fallbackData } = options;
  const [data, setData] = useState<T>(fallbackData);
  const [source, setSource] = useState<FetchSource>("fallback");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetchWithFallback<T>(url, {
      tenantId: tenantId ?? undefined,
      fallbackData,
    });
    setData(r.data);
    setSource(r.source);
    setError(r.error);
    setLoading(false);
  }, [url, tenantId, fallbackData]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, source, loading, error, refresh: load };
}

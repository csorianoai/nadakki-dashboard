"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
 * Fetches exactly once per (url, tenantId) pair. Manual refresh via `refresh()`.
 */
export function useFetchWithFallback<T>(
  url: string,
  options: { tenantId?: string | null; fallbackData: T }
): UseFetchWithFallbackResult<T> {
  const { tenantId, fallbackData } = options;
  const fetchKey = `${url}\0${tenantId ?? ""}`;
  const keyRef = useRef<string | null>(null);
  const fallbackRef = useRef(fallbackData);
  if (keyRef.current === null) {
    keyRef.current = fetchKey;
    fallbackRef.current = fallbackData;
  } else if (keyRef.current !== fetchKey) {
    keyRef.current = fetchKey;
    fallbackRef.current = fallbackData;
  }

  const [data, setData] = useState<T>(fallbackData);
  const [source, setSource] = useState<FetchSource>("fallback");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetchWithFallback<T>(url, {
      tenantId: tenantId ?? undefined,
      fallbackData: fallbackRef.current,
    });
    setData(r.data);
    setSource(r.source);
    setError(r.error);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, tenantId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, source, loading, error, refresh: load };
}

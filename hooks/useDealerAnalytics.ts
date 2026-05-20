"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getDealerAnalytics } from "@/lib/dealer/analytics-api";
import type { AnalyticsPeriod, DealerAnalytics } from "@/types/dealer-analytics";

export function useDealerAnalytics(period: AnalyticsPeriod = "30d") {
  const [data, setData] = useState<DealerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getDealerAnalytics(period)
      .then((result) => {
        if (!active || !mountedRef.current) return;
        setData(result);
      })
      .catch((err) => {
        if (!active || !mountedRef.current) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (!active || !mountedRef.current) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [period]);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    getDealerAnalytics(period)
      .then((result) => {
        if (!mountedRef.current) return;
        setData(result);
      })
      .catch((err) => {
        if (!mountedRef.current) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (!mountedRef.current) return;
        setLoading(false);
      });
  }, [period]);

  return { data, loading, error, refetch };
}

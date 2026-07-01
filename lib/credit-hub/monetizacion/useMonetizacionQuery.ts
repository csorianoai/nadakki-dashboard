"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type MonetizacionQueryStatus = "loading" | "ready" | "error";

const DEFAULT_ERROR = "No se pudieron leer los eventos de origen.";

export function useMonetizacionQuery<T>(
  fetcher: () => Promise<T>,
  options?: { initialData?: T },
) {
  const [data, setData] = useState<T | null>(options?.initialData ?? null);
  const [status, setStatus] = useState<MonetizacionQueryStatus>(
    options?.initialData !== undefined ? "ready" : "loading",
  );
  const [error, setError] = useState<string | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const run = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const result = await fetcherRef.current();
      setData(result);
      setStatus("ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : DEFAULT_ERROR);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (options?.initialData === undefined) {
      void run();
    }
  }, [run, options?.initialData]);

  const retry = useCallback(() => {
    void run();
  }, [run]);

  return { data, status, error, retry };
}

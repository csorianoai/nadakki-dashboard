"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchMarketingAgents } from "@/lib/api/marketing";

export type MarketingAgent = {
  id?: string;
  name?: string;
  title?: string;
  category?: string;
  status?: string;
  [k: string]: unknown;
};

export type UseMarketingAgentsResult = {
  agents: MarketingAgent[];
  total: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useMarketingAgents(limit = 1000): UseMarketingAgentsResult {
  const [agents, setAgents] = useState<MarketingAgent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchMarketingAgents(limit);
    if (result.error) {
      setError(result.error);
      setAgents([]);
      setTotal(0);
    } else {
      setAgents(result.agents);
      setTotal(result.total);
      setError(null);
    }
    setLoading(false);
  }, [limit]);

  // Retry 1x after 3s on error
  useEffect(() => {
    if (error && retryCount < 1) {
      const timer = setTimeout(() => {
        setRetryCount(1);
        load();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, retryCount, load]);

  useEffect(() => {
    load();
  }, [load]);

  // Reset retry when load succeeds
  useEffect(() => {
    if (!error) setRetryCount(0);
  }, [error]);

  return { agents, total, loading, error, refresh: load };
}

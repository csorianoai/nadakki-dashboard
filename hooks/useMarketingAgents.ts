"use client";

import { useEffect, useState, useCallback } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { fetchMarketingAgents } from "@/lib/api/marketing";
import type { FetchSource } from "@/lib/api/client";

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
  source: FetchSource;
  refresh: () => Promise<void>;
};

export function useMarketingAgents(limit = 1000): UseMarketingAgentsResult {
  const { tenantId } = useTenant();
  const [agents, setAgents] = useState<MarketingAgent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<FetchSource>("fallback");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchMarketingAgents(tenantId, limit);
    setAgents(result.agents as MarketingAgent[]);
    setTotal(result.total);
    setSource(result.source);
    setError(result.error);
    setLoading(false);
  }, [limit, tenantId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { agents, total, loading, error, source, refresh: load };
}

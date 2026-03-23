"use client";

import { useCallback, useEffect, useState } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { fetchMarketingCampaigns } from "@/lib/api/marketing";
import type { FetchSource } from "@/lib/api/client";

export type MarketingCampaignRow = Record<string, unknown>;

export type UseMarketingCampaignsResult = {
  campaigns: MarketingCampaignRow[];
  total: number;
  loading: boolean;
  error: string | null;
  source: FetchSource;
  refresh: () => Promise<void>;
};

export function useMarketingCampaigns(): UseMarketingCampaignsResult {
  const { tenantId } = useTenant();
  const [campaigns, setCampaigns] = useState<MarketingCampaignRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<FetchSource>("fallback");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const r = await fetchMarketingCampaigns(tenantId);
    setCampaigns(r.campaigns);
    setTotal(r.total);
    setSource(r.source);
    setError(r.error);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { campaigns, total, loading, error, source, refresh: load };
}

"use client";

import { useState, useEffect, useCallback } from "react";

export interface MarketingStats {
  campaigns: number;
  activeJourneys: number;
  contacts: number;
  conversionRate: number;
}

export interface UseMarketingStatsResult {
  stats: MarketingStats;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
}

const DEFAULT_STATS: MarketingStats = {
  campaigns: 12,
  activeJourneys: 5,
  contacts: 125000,
  conversionRate: 3.2
};

export function useMarketingStats(tenantId: string | null): UseMarketingStatsResult {
  const [stats, setStats] = useState<MarketingStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = useCallback(async () => {
    if (!tenantId) {
      setLoading(false);
      setStats(DEFAULT_STATS);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://nadakki-ai-suite.onrender.com";
      const response = await fetch(`${apiUrl}/api/marketing/dashboard?tenant_id=${tenantId}`, {
        headers: { "Accept": "application/json", "X-Tenant-ID": tenantId },
        signal: AbortSignal.timeout(10000),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const { campaigns, journeys, contacts, conversions } = data.data;
          setStats({ campaigns: campaigns?.total || DEFAULT_STATS.campaigns, activeJourneys: journeys?.total || DEFAULT_STATS.activeJourneys, contacts: contacts?.total || DEFAULT_STATS.contacts, conversionRate: conversions?.rate || DEFAULT_STATS.conversionRate });
          setLastUpdated(new Date());
          return;
        }
      }
      setError("No se pudieron cargar los datos");
      setStats(DEFAULT_STATS);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error desconocido";
      setError(errorMsg);
      setStats(DEFAULT_STATS);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { const interval = setInterval(fetchStats, 30000); return () => clearInterval(interval); }, [fetchStats]);

  return { stats, loading, error, lastUpdated, refresh: fetchStats };
}

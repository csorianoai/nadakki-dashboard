"use client";

import { useState, useEffect, useCallback } from "react";

/** Per-metric nullable: only non-null values come from the API (no demo numbers). */
export interface MarketingStats {
  campaigns: number | null;
  activeJourneys: number | null;
  contacts: number | null;
  conversionRate: number | null;
}

export interface UseMarketingStatsResult {
  stats: MarketingStats | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
}

function numFrom(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseDashboardPayload(data: unknown): MarketingStats | null {
  if (!data || typeof data !== "object") return null;
  const root = data as { success?: unknown; data?: unknown };
  if (!root.success || !root.data || typeof root.data !== "object") return null;
  const d = root.data as {
    campaigns?: { total?: unknown };
    journeys?: { total?: unknown };
    contacts?: { total?: unknown };
    conversions?: { rate?: unknown };
  };
  const stats: MarketingStats = {
    campaigns: numFrom(d.campaigns?.total),
    activeJourneys: numFrom(d.journeys?.total),
    contacts: numFrom(d.contacts?.total),
    conversionRate: numFrom(d.conversions?.rate),
  };
  if (stats.campaigns == null && stats.activeJourneys == null && stats.contacts == null && stats.conversionRate == null) {
    return null;
  }
  return stats;
}

export function useMarketingStats(tenantId: string | null): UseMarketingStatsResult {
  const [stats, setStats] = useState<MarketingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = useCallback(async () => {
    if (!tenantId?.trim()) {
      setLoading(false);
      setStats(null);
      setError(null);
      setLastUpdated(null);
      return;
    }
    const tid = tenantId.trim();
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/marketing/dashboard?tenant_id=${encodeURIComponent(tid)}`, {
        headers: { Accept: "application/json", "X-Tenant-ID": tid },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        setStats(null);
        setError(`No se pudieron cargar los datos (HTTP ${response.status}).`);
        return;
      }

      const data = await response.json();
      const parsed = parseDashboardPayload(data);
      if (!parsed) {
        setStats(null);
        setError("Respuesta inválida o incompleta del servidor.");
        return;
      }
      setStats(parsed);
      setLastUpdated(new Date());
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error desconocido";
      setError(errorMsg);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    const interval = setInterval(() => {
      void fetchStats();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  return { stats, loading, error, lastUpdated, refresh: fetchStats };
}

"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Same-origin; proxied via next.config rewrites / app/api.
// Keeps identical pattern to other dashboard API calls.
const API_URL = "";

const BASE = "/api/v1/system/autonomous";

export type SystemStatus = "healthy" | "warning" | "critical" | "unknown";

export type SystemCheck = {
  name: string;
  status: string;
  [k: string]: unknown;
};

export type AutonomousStatus = {
  current_score: number | null;
  current_status: SystemStatus | string;
  last_run_at: string | null;
  last_run_id: string | null;
  scheduler_active: boolean;
  next_run_in_seconds: number | null;
};

export type TrendBucket = {
  bucket_hour: string;
  avg_score: number;
  run_count: number;
  critical_count: number;
};

export type HealthRun = {
  run_id?: string;
  run_type?: string;
  triggered_by?: string | null;
  started_at?: string;
  overall_status?: string;
  overall_score?: number;
  raw_result?: {
    checks?: SystemCheck[];
    score?: number;
    status?: string;
  };
  actions_taken?: Array<Record<string, unknown>>;
};

export type TriggerRunResult = {
  success: boolean;
  error?: string;
  data?: {
    run_type?: string;
    normalized?: { score?: number; status?: string; checks?: SystemCheck[] };
    actions_evaluated?: string[];
    actions_executed?: Array<Record<string, unknown>>;
    errors?: string[];
    duration_ms?: number;
  };
};

export interface UseSystemHealth {
  currentScore: number | null;
  currentStatus: SystemStatus;
  lastRunAt: string | null;
  schedulerActive: boolean;
  nextRunInSeconds: number | null;
  trend: TrendBucket[];
  latestRun: HealthRun | null;
  recentActions: Array<Record<string, unknown>>;
  checks: SystemCheck[];
  isLoading: boolean;
  isTriggering: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  triggerManualRun: (opts?: { dryRun?: boolean }) => Promise<TriggerRunResult>;
}

function toSystemStatus(s: string | null | undefined): SystemStatus {
  const v = (s || "").toLowerCase();
  if (v === "healthy" || v === "warning" || v === "critical" || v === "unknown") {
    return v as SystemStatus;
  }
  return "unknown";
}

async function safeGet<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${url}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export function useSystemHealth(pollMs: number = 60_000): UseSystemHealth {
  const [status, setStatus] = useState<AutonomousStatus | null>(null);
  const [trend, setTrend] = useState<TrendBucket[]>([]);
  const [latestRun, setLatestRun] = useState<HealthRun | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isTriggering, setIsTriggering] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef<boolean>(true);

  const loadAll = useCallback(async () => {
    const [statusRes, trendRes, historyRes] = await Promise.all([
      safeGet<AutonomousStatus & { error?: string }>(`${BASE}/status`),
      safeGet<{ success: boolean; buckets: TrendBucket[] }>(`${BASE}/trend?hours=168`),
      safeGet<{ success: boolean; data: HealthRun[] }>(`${BASE}/history?limit=1`),
    ]);
    if (!mountedRef.current) return;
    if (statusRes) {
      setStatus({
        current_score: statusRes.current_score ?? null,
        current_status: statusRes.current_status ?? "unknown",
        last_run_at: statusRes.last_run_at ?? null,
        last_run_id: statusRes.last_run_id ?? null,
        scheduler_active: !!statusRes.scheduler_active,
        next_run_in_seconds: statusRes.next_run_in_seconds ?? null,
      });
      setError(statusRes.error ?? null);
    } else {
      setError("No se pudo obtener el estado autónomo");
    }
    if (trendRes?.success) setTrend(trendRes.buckets || []);
    if (historyRes?.success && historyRes.data && historyRes.data.length > 0) {
      setLatestRun(historyRes.data[0] || null);
    }
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      await loadAll();
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [loadAll]);

  const triggerManualRun = useCallback(
    async (opts?: { dryRun?: boolean }): Promise<TriggerRunResult> => {
      setIsTriggering(true);
      try {
        const res = await fetch(`${API_URL}${BASE}/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            triggered_by: "manual_ui",
            dry_run: !!(opts?.dryRun ?? true),
          }),
        });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          return { success: false, error: `HTTP ${res.status}: ${text.slice(0, 200)}` };
        }
        const json = (await res.json()) as TriggerRunResult;
        await loadAll();
        return json;
      } catch (e) {
        return { success: false, error: (e as Error).message };
      } finally {
        if (mountedRef.current) setIsTriggering(false);
      }
    },
    [loadAll],
  );

  useEffect(() => {
    mountedRef.current = true;
    refresh();
    if (!pollMs || pollMs <= 0) {
      return () => {
        mountedRef.current = false;
      };
    }
    const id = setInterval(() => {
      void loadAll();
    }, pollMs);
    return () => {
      mountedRef.current = false;
      clearInterval(id);
    };
  }, [pollMs, loadAll, refresh]);

  const recentActions = useMemo(() => {
    if (!latestRun?.actions_taken) return [];
    return latestRun.actions_taken;
  }, [latestRun]);

  const checks = useMemo(() => {
    return latestRun?.raw_result?.checks || [];
  }, [latestRun]);

  return {
    currentScore: status?.current_score ?? null,
    currentStatus: toSystemStatus(status?.current_status),
    lastRunAt: status?.last_run_at ?? null,
    schedulerActive: status?.scheduler_active ?? false,
    nextRunInSeconds: status?.next_run_in_seconds ?? null,
    trend,
    latestRun,
    recentActions,
    checks,
    isLoading,
    isTriggering,
    error,
    refresh,
    triggerManualRun,
  };
}

export default useSystemHealth;

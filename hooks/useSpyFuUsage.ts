"use client";

import { useCallback, useEffect, useState } from "react";
import { spyfu } from "@/lib/api/spyfu-client";
import type { UsageResponse } from "@/types/spyfu";

export interface UsageView extends UsageResponse {
  cache_hit_rate_pct: number | null;
}

function enrich(u: UsageResponse | null): UsageView | null {
  if (!u) return null;
  const calls = typeof u.calls_made === "number" ? u.calls_made : 0;
  const hits = typeof u.cache_hits === "number" ? u.cache_hits : 0;
  const cache_hit_rate_pct = calls > 0 ? Math.round((hits / calls) * 1000) / 10 : null;
  return { ...u, cache_hit_rate_pct };
}

export function useSpyFuUsage(tenantId: string | null, pollMs = 30_000) {
  const [usage, setUsage] = useState<UsageView | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!tenantId) return;
    try {
      const u = await spyfu.getUsage(tenantId);
      setUsage(enrich(u));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    }
  }, [tenantId]);

  useEffect(() => {
    if (!tenantId) {
      setUsage(null);
      return;
    }
    refresh();
    const t = setInterval(refresh, pollMs);
    return () => clearInterval(t);
  }, [tenantId, pollMs, refresh]);

  return { usage, error, refresh };
}

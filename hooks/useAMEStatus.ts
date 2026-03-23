"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { fetchWithFallback, type FetchSource } from "@/lib/api/client";
import { AME_ENDPOINTS } from "@/lib/api/endpoints";
import { FALLBACK_AME_STATUS, type AMEStatusData } from "@/lib/fallbacks/ame";

export function useAMEStatus(tenantIdParam: string | null | undefined, refreshKey = 0) {
  const { tenantId } = useTenant();
  const { tenantId: authTenantId } = useAuth();
  const [data, setData] = useState<AMEStatusData>(FALLBACK_AME_STATUS);
  const [source, setSource] = useState<FetchSource>("fallback");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const resolvedTenant =
    (tenantIdParam != null && String(tenantIdParam).trim())
      ? String(tenantIdParam).trim()
      : (tenantId && tenantId.trim()) || (authTenantId && authTenantId.trim()) || undefined;

  useEffect(() => {
    if (!resolvedTenant) {
      setData(FALLBACK_AME_STATUS);
      setSource("fallback");
      setError(null);
      setLoading(false);
      return;
    }
    const ac = new AbortController();
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const res = await fetchWithFallback<AMEStatusData>(AME_ENDPOINTS.STATUS, {
        tenantId: resolvedTenant,
        fallbackData: FALLBACK_AME_STATUS,
        signal: ac.signal,
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-ID": resolvedTenant,
        },
      });
      if (cancelled) return;
      if (res.error === "AbortError") return;
      setData(res.data);
      setSource(res.source);
      setError(res.error);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [resolvedTenant, refreshKey]);

  return { data, source, loading, error };
}

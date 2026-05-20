"use client";

import { useState, useEffect, useCallback } from "react";
import { Building2, Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";
import { apiFetch } from "@/lib/api/fetch-client";

const FALLBACK_TENANT = "sf-rentals-nadaki-excursions";

export default function SicMultitenantConfigPage() {
  const { tenantId } = useTenant();
  const effectiveTenant = tenantId?.trim() || FALLBACK_TENANT;
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/v2/sic-mt/status", {
        cache: "no-store",
        headers: { Accept: "application/json", "X-Tenant-ID": effectiveTenant },
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`HTTP ${res.status}: ${t.slice(0, 200)}`);
      }
      setData(await res.json());
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [effectiveTenant]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="min-h-screen p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <Building2 size={20} className="text-sky-400" />
            SIC Multi-Tenant Config (v2)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Same-origin proxy to <code className="text-slate-600">/api/v2/sic-mt/*</code>
          </p>
          <p className="text-xs text-slate-600 mt-1 font-mono">Tenant: {effectiveTenant}</p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700/50 text-slate-300 hover:bg-slate-800/50 disabled:opacity-50 text-sm"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div
        className="rounded-xl border border-slate-700/40 p-5"
        style={{ backgroundColor: "rgba(15,20,40,0.8)" }}
      >
        {loading && (
          <div className="flex items-center gap-2 text-slate-500 py-8 justify-center">
            <Loader2 size={20} className="animate-spin" />
            <span>Loading /api/v2/sic-mt/status…</span>
          </div>
        )}
        {!loading && error && (
          <p className="text-sm text-amber-400 flex items-center gap-2">
            <AlertTriangle size={16} />
            {error}
          </p>
        )}
        {!loading && !error && data != null && (
          <pre className="text-xs text-slate-300 overflow-auto max-h-[70vh] whitespace-pre-wrap break-words">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

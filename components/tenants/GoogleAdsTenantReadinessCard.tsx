"use client";

import { Loader2, RefreshCw } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import {
  campaignStatusClass,
  overallBadgeClass,
  type GoogleAdsTenantReadinessPayload,
  type OverallReadiness,
} from "@/lib/api/googleAdsTenantReadiness";

export type GoogleAdsTenantReadinessCardProps = {
  tenantId: string;
  data: GoogleAdsTenantReadinessPayload | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  refreshing: boolean;
};

const LABELS: Record<string, string> = {
  SEARCH: "Search",
  PERFORMANCE_MAX: "Performance Max",
  DEMAND_GEN: "Demand Gen",
  SHOPPING: "Shopping",
  DSA: "DSA",
};

function statusLabel(s: OverallReadiness): string {
  switch (s) {
    case "ready":
      return "Ready";
    case "partial":
      return "Partial";
    case "blocked":
      return "Blocked";
    case "disconnected":
      return "Disconnected";
    default:
      return s;
  }
}

export default function GoogleAdsTenantReadinessCard({
  tenantId,
  data,
  loading,
  error,
  onRefresh,
  refreshing,
}: GoogleAdsTenantReadinessCardProps) {
  const busy = loading || refreshing;

  return (
    <GlassCard className="p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-lg font-bold text-white m-0 mb-1">Google Ads — tenant readiness</h3>
          <p className="text-xs text-slate-500 m-0 max-w-xl">
            Advisory only: computed from tenant profile, OAuth/Ads linkage, and policy flags. No mutations.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={busy}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 border border-white/15 text-sm text-white hover:bg-white/15 disabled:opacity-50"
        >
          {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refresh readiness
        </button>
      </div>

      {loading && !data ? (
        <p className="text-sm text-slate-400 mt-4 inline-flex items-center gap-2 m-0">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading readiness…
        </p>
      ) : error ? (
        <p className="text-sm text-rose-300/90 mt-4 m-0">{error}</p>
      ) : data ? (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`text-xs font-mono uppercase px-3 py-1 rounded-full border ${overallBadgeClass(data.overall_status)}`}
            >
              {statusLabel(data.overall_status)}
            </span>
            <span className="text-xs text-slate-500">
              Last checked: {data.last_checked_at ? new Date(data.last_checked_at).toLocaleString() : "—"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 sm:col-span-2">
              <span className="text-slate-500 text-xs block mb-1">Tenant vertical</span>
              <span className="text-white font-medium font-mono text-xs">
                {data.tenant_vertical?.trim() ? data.tenant_vertical : "unknown"}
              </span>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <span className="text-slate-500 text-xs block mb-1">API connected (Ads)</span>
              <span className="text-white font-medium">{data.api_connected ? "Yes" : "No"}</span>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <span className="text-slate-500 text-xs block mb-1">Customer ID on file</span>
              <span className="text-white font-medium">{data.customer_id_present ? "Yes" : "No"}</span>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <span className="text-slate-500 text-xs block mb-1">Tracking ready</span>
              <span className="text-white font-medium">{data.tracking_ready ? "Yes" : "No"}</span>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <span className="text-slate-500 text-xs block mb-1">Compliance</span>
              <span className="text-white font-medium">{data.compliance_status}</span>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white m-0 mb-2">Campaign types</h4>
            <div className="overflow-x-auto rounded-lg border border-white/10">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-white/10 text-xs text-slate-500">
                    <th className="p-2 font-medium">Type</th>
                    <th className="p-2 font-medium">Status</th>
                    <th className="p-2 font-medium">Reasons</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.campaign_types ?? []).map((row) => (
                    <tr key={row.campaign_type} className="border-b border-white/5 last:border-0">
                      <td className="p-2 text-white">{LABELS[row.campaign_type] ?? row.campaign_type}</td>
                      <td className={`p-2 font-mono text-xs ${campaignStatusClass(row.status)}`}>{row.status}</td>
                      <td className="p-2 text-slate-400 text-xs">
                        {(row.reasons ?? []).length ? row.reasons.join(" · ") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {(data.blocking_issues ?? []).length > 0 ? (
            <div>
              <h4 className="text-sm font-semibold text-amber-200/90 m-0 mb-2">Blocking issues</h4>
              <ul className="list-disc pl-5 m-0 text-sm text-slate-300 space-y-1">
                {data.blocking_issues.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 p-3">
            <span className="text-xs text-slate-500 block mb-1">Recommended next step</span>
            <p className="text-sm text-slate-200 m-0">{data.recommended_next_step || "—"}</p>
          </div>

          {(data.data_sources?.length ?? 0) > 0 ? (
            <details className="text-xs text-slate-500">
              <summary className="cursor-pointer text-slate-400 hover:text-slate-300 select-none">
                Data sources (read-only provenance)
              </summary>
              <ul className="mt-2 pl-4 list-disc space-y-0.5 font-mono text-[10px] text-slate-600">
                {data.data_sources!.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </details>
          ) : null}

          <p className="text-[10px] text-slate-600 m-0 font-mono">tenant: {tenantId}</p>
        </div>
      ) : (
        <p className="text-sm text-slate-500 mt-4 m-0">No readiness data.</p>
      )}
    </GlassCard>
  );
}

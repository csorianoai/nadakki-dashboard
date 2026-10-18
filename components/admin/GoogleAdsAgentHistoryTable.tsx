"use client";

import {
  normalizeGoogleAdsCheckStatus,
  countStepsPassedFailed,
  type GoogleAdsCheckStatus,
} from "@/lib/google-ads-agent-ops";

export type HistoryRow = {
  runId: string;
  startedAt?: string;
  completedAt?: string;
  status: GoogleAdsCheckStatus;
  passed: number | null;
  failed: number | null;
  initiatedBy?: string | null;
};

function formatTime(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { dateStyle: "short", timeStyle: "medium" });
}

function rowFromApi(r: Record<string, unknown>, index: number): HistoryRow {
  const runId = String(r.run_id ?? r.id ?? r.runId ?? index).trim() || String(index);
  const { passed, failed } = countStepsPassedFailed(r);
  const status = normalizeGoogleAdsCheckStatus(r.status ?? r.overall_status);
  const initiated =
    typeof r.initiated_by === "string"
      ? r.initiated_by
      : typeof r.initiatedBy === "string"
        ? r.initiatedBy
        : typeof r.triggered_by === "string"
          ? r.triggered_by
          : null;
  const startedAt =
    typeof r.started_at === "string"
      ? r.started_at
      : typeof r.started === "string"
        ? r.started
        : undefined;
  const completedAt =
    typeof r.completed_at === "string"
      ? r.completed_at
      : typeof r.completed === "string"
        ? r.completed
        : undefined;

  return {
    runId,
    startedAt,
    completedAt,
    status,
    passed,
    failed,
    initiatedBy: initiated,
  };
}

function statusBadgeClass(st: GoogleAdsCheckStatus): string {
  switch (st) {
    case "ready":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-200";
    case "partial":
      return "border-amber-500/40 bg-amber-500/10 text-amber-100";
    case "no_go":
    case "failed":
      return "border-rose-500/40 bg-rose-500/10 text-rose-100";
    case "running":
      return "border-sky-500/40 bg-sky-500/10 text-sky-100";
    default:
      return "border-white/15 bg-white/5 text-slate-300";
  }
}

export type GoogleAdsAgentHistoryTableProps = {
  rows: Record<string, unknown>[];
  loading: boolean;
  error: string | null;
  onViewDetails: (runId: string) => void;
};

export default function GoogleAdsAgentHistoryTable({
  rows,
  loading,
  error,
  onViewDetails,
}: GoogleAdsAgentHistoryTableProps) {
  const mapped = rows.map(rowFromApi);

  return (
    <div className="overflow-x-auto">
      {error ? <p className="text-sm text-amber-200/90 mb-3 m-0">History unavailable: {error}</p> : null}
      {loading ? (
        <p className="text-sm text-slate-500 m-0">Loading history…</p>
      ) : mapped.length === 0 ? (
        <p className="text-sm text-slate-500 m-0">No prior runs returned.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-white/10">
              <th className="py-2 pr-4">Time</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Passed / failed</th>
              <th className="py-2 pr-4">Initiated by</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mapped.map((row) => (
              <tr key={row.runId} className="border-b border-white/5">
                <td className="py-2 pr-4 text-slate-300 whitespace-nowrap font-mono text-xs">
                  {formatTime(row.completedAt ?? row.startedAt)}
                </td>
                <td className="py-2 pr-4">
                  <span className={`text-[11px] uppercase px-2 py-0.5 rounded border ${statusBadgeClass(row.status)}`}>
                    {row.status}
                  </span>
                </td>
                <td className="py-2 pr-4 text-slate-300">
                  {row.passed != null || row.failed != null ? (
                    <>
                      {row.passed ?? "—"} / {row.failed ?? "—"}
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="py-2 pr-4 text-slate-400 font-mono text-xs">{row.initiatedBy ?? "—"}</td>
                <td className="py-2 text-right">
                  <button
                    type="button"
                    onClick={() => onViewDetails(row.runId)}
                    className="text-cyan-400 hover:underline text-xs"
                  >
                    View details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

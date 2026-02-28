"use client";

import type { RunSummary } from "@/hooks/observability";

interface RunHistoryProps {
  runs: RunSummary[];
  loading: boolean;
  onRefresh: () => void;
  onSelectRun?: (runId: string) => void;
}

export function RunHistory({ runs, loading, onRefresh, onSelectRun }: RunHistoryProps) {
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Run History</h3>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="text-xs text-cyan-400 hover:text-cyan-300 disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {runs.length === 0 ? (
        <p className="text-sm text-slate-500">No runs yet. Execute an agent to see history.</p>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {runs.map((r) => (
            <div
              key={r.run_id}
              onClick={() => onSelectRun?.(r.run_id)}
              className={`rounded-lg border border-slate-700/50 bg-slate-800/40 p-3 cursor-pointer hover:bg-slate-800/60 transition-colors ${
                onSelectRun ? "" : "cursor-default"
              }`}
            >
              <div className="flex justify-between items-start">
                <span className="text-sm font-mono text-cyan-300 truncate max-w-[140px]" title={r.run_id}>
                  {r.run_id.slice(0, 8)}…
                </span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    r.status === "succeeded"
                      ? "bg-green-500/20 text-green-400"
                      : r.status === "failed" || r.status === "canceled"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-amber-500/20 text-amber-400"
                  }`}
                >
                  {r.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{r.agent_id}</p>
              <p className="text-xs text-slate-500 mt-0.5">{r.created_at ?? ""}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


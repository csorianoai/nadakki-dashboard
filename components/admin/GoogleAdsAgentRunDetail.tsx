"use client";

import { Loader2, X } from "lucide-react";
import {
  humanStatusMeaning,
  normalizeGoogleAdsCheckStatus,
  parseSteps,
  countStepsPassedFailed,
} from "@/lib/google-ads-agent-ops";

function stepBadgeClass(raw: string): string {
  const s = raw.toLowerCase();
  if (/\b(pass|ok|success|passed|healthy)\b/.test(s)) {
    return "border-emerald-500/40 bg-emerald-500/10 text-emerald-200";
  }
  if (/\b(fail|error|critical|no_go|blocked)\b/.test(s)) {
    return "border-rose-500/40 bg-rose-500/10 text-rose-100";
  }
  if (/\b(warn|skip|partial|degraded)\b/.test(s)) {
    return "border-amber-500/40 bg-amber-500/10 text-amber-100";
  }
  if (/\b(run|pending|progress)\b/.test(s)) {
    return "border-sky-500/40 bg-sky-500/10 text-sky-100";
  }
  return "border-white/15 bg-white/5 text-slate-300";
}

function summaryJsonBlock(data: unknown): string {
  if (data == null) return "";
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

export type GoogleAdsAgentRunDetailProps = {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  error: string | null;
  run: Record<string, unknown> | null;
};

export default function GoogleAdsAgentRunDetail({ open, onClose, loading, error, run }: GoogleAdsAgentRunDetailProps) {
  if (!open) return null;

  const st = normalizeGoogleAdsCheckStatus(run?.status ?? run?.overall_status);
  const meaning = humanStatusMeaning(st);
  const steps = parseSteps(run ?? undefined);
  const { passed, failed } = countStepsPassedFailed(run ?? undefined);
  const summaryJson = run?.summary_json ?? run?.summaryJson ?? run?.payload;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" className="absolute inset-0 bg-black/60" aria-label="Close" onClick={onClose} />
      <aside className="relative w-full max-w-lg h-full bg-slate-950 border-l border-white/10 shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div>
            <h2 className="text-sm font-semibold text-white m-0">Run detail</h2>
            <p className="text-[11px] text-slate-500 m-0 mt-0.5 font-mono break-all">
              {typeof run?.run_id === "string"
                ? run.run_id
                : typeof run?.id === "string"
                  ? run.id
                  : "—"}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10" aria-label="Close panel">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading run…
            </div>
          ) : error ? (
            <p className="text-sm text-amber-200/90 m-0">{error}</p>
          ) : run ? (
            <>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-[10px] uppercase text-slate-500 m-0 mb-1">Overall</p>
                <p className="text-sm text-slate-200 m-0">
                  <span className="font-mono text-cyan-300">{st}</span>
                  <span className="text-slate-500"> · </span>
                  {meaning}
                </p>
                {(passed != null || failed != null) && (
                  <p className="text-xs text-slate-400 m-0 mt-2">
                    Steps: {passed ?? "—"} passed · {failed ?? "—"} failed
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-400 m-0 mb-2">Step results</p>
                {steps.length === 0 ? (
                  <p className="text-sm text-slate-500 m-0">No step rows in this payload.</p>
                ) : (
                  <ul className="space-y-2 m-0 p-0 list-none">
                    {steps.map((s, i) => (
                      <li key={`${s.name}-${i}`} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm text-white font-medium break-words">{s.name}</span>
                          <span
                            className={`text-[10px] uppercase shrink-0 px-2 py-0.5 rounded border ${stepBadgeClass(s.status)}`}
                          >
                            {s.status}
                          </span>
                        </div>
                        {s.detail ? <p className="text-xs text-slate-400 m-0 mt-1 break-words">{s.detail}</p> : null}
                        {s.durationMs != null ? (
                          <p className="text-[10px] text-slate-600 m-0 mt-1">{s.durationMs} ms</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {summaryJson != null && typeof summaryJson === "object" ? (
                <div>
                  <p className="text-xs font-semibold text-slate-400 m-0 mb-2">Summary payload</p>
                  <pre className="text-[11px] leading-relaxed text-slate-400 bg-black/40 border border-white/10 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words m-0">
                    {summaryJsonBlock(summaryJson)}
                  </pre>
                </div>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-slate-500 m-0">No run selected.</p>
          )}
        </div>
      </aside>
    </div>
  );
}

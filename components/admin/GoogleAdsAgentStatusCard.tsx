"use client";

import { Loader2, Play } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import {
  humanStatusMeaning,
  normalizeGoogleAdsCheckStatus,
  type GoogleAdsCheckStatus,
  countStepsPassedFailed,
  parseSteps,
  type ParsedStep,
} from "@/lib/google-ads-agent-ops";

function semaphoreDotClass(status: GoogleAdsCheckStatus): string {
  switch (status) {
    case "ready":
      return "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.65)]";
    case "partial":
      return "bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.55)]";
    case "no_go":
    case "failed":
      return "bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.55)]";
    case "running":
      return "bg-sky-500 shadow-[0_0_12px_rgba(14,165,233,0.55)] animate-pulse";
    default:
      return "bg-slate-500";
  }
}

function readinessNote(status: GoogleAdsCheckStatus): string | null {
  if (status === "ready") return null;
  if (status === "running") return null;
  if (status === "unknown")
    return "Overall status is ambiguous; do not treat this run as a full production gate.";
  return "This outcome is not a production go-ahead for the Google Ads Agent stack.";
}

export type GoogleAdsAgentStatusCardProps = {
  title?: string;
  latest: Record<string, unknown> | null;
  stepsOverride?: ParsedStep[] | null;
  loading: boolean;
  error: string | null;
  runningAction: boolean;
  onRunCheck: () => void;
};

function formatIso(s: unknown): string {
  if (typeof s !== "string" || !s.trim()) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString(undefined, { dateStyle: "short", timeStyle: "medium" });
}

export default function GoogleAdsAgentStatusCard({
  title = "Google Ads Agent",
  latest,
  stepsOverride,
  loading,
  error,
  runningAction,
  onRunCheck,
}: GoogleAdsAgentStatusCardProps) {
  const statusRaw = latest?.status ?? latest?.overall_status;
  const st = normalizeGoogleAdsCheckStatus(statusRaw);
  const meaning = humanStatusMeaning(st);
  const summary =
    typeof latest?.summary === "string"
      ? latest.summary
      : typeof latest?.message === "string"
        ? latest.message
        : typeof latest?.one_liner === "string"
          ? latest.one_liner
          : "";
  const { passed, failed } = countStepsPassedFailed(latest ?? undefined);
  const steps = stepsOverride ?? parseSteps(latest ?? undefined);
  const note = readinessNote(st);
  const disableRun = runningAction || st === "running" || loading;

  return (
    <GlassCard className="p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex flex-col items-center gap-1 pt-0.5">
            <span
              className={`inline-block w-3.5 h-3.5 rounded-full shrink-0 ${semaphoreDotClass(st)}`}
              title={meaning}
              aria-label={`Operational status: ${st}`}
            />
            <span className="text-[10px] uppercase tracking-wide text-slate-500 font-mono">{st}</span>
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-white m-0 mb-1">{title}</h2>
            <p className="text-sm text-slate-300 m-0 mb-2">{meaning}</p>
            {summary ? (
              <p className="text-sm text-slate-400 m-0 break-words">{summary}</p>
            ) : !loading && !error ? (
              <p className="text-sm text-slate-500 m-0">
                {latest ? "No summary line returned for this run." : "No completed operational check on record yet."}
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              <span>
                Started: <span className="text-slate-300 font-mono">{formatIso(latest?.started_at ?? latest?.started)}</span>
              </span>
              <span>
                Completed:{" "}
                <span className="text-slate-300 font-mono">{formatIso(latest?.completed_at ?? latest?.completed)}</span>
              </span>
              <span>
                Steps:{" "}
                <span className="text-slate-300">
                  {passed != null || failed != null ? (
                    <>
                      {passed ?? "—"} passed · {failed ?? "—"} failed
                    </>
                  ) : steps.length > 0 ? (
                    <>derived from {steps.length} step row(s)</>
                  ) : (
                    "—"
                  )}
                </span>
              </span>
            </div>
            {note ? <p className="text-xs text-amber-200/90 mt-3 m-0">{note}</p> : null}
          </div>
        </div>
        <button
          type="button"
          onClick={onRunCheck}
          disabled={disableRun}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 text-sm font-medium shrink-0"
        >
          {runningAction ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {runningAction ? "Running…" : "Run Check"}
        </button>
      </div>
      {error ? <p className="text-sm text-amber-200/90 mt-4 m-0">Latest check unavailable: {error}</p> : null}
      {loading ? (
        <p className="text-sm text-slate-500 mt-4 m-0 inline-flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading latest run…
        </p>
      ) : null}
    </GlassCard>
  );
}

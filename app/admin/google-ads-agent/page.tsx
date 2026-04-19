"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Search } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import GoogleAdsAgentStatusCard from "@/components/admin/GoogleAdsAgentStatusCard";
import GoogleAdsAgentHistoryTable from "@/components/admin/GoogleAdsAgentHistoryTable";
import GoogleAdsAgentRunDetail from "@/components/admin/GoogleAdsAgentRunDetail";
import { useTenant } from "@/contexts/TenantContext";
import {
  getLatestGoogleAdsAgentCheck,
  getGoogleAdsAgentCheckHistory,
  runGoogleAdsAgentCheck,
  getGoogleAdsAgentCheck,
  historyRunsFromPayload,
  normalizeGoogleAdsCheckStatus,
  parseSteps,
} from "@/lib/google-ads-agent-ops";
import { suiteFailure } from "@/lib/api/suiteOps";

function stepRowBadgeClass(raw: string): string {
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

export default function GoogleAdsAgentOpsPage() {
  const { tenantId } = useTenant();
  const [latest, setLatest] = useState<Record<string, unknown> | null>(null);
  const [historyRows, setHistoryRows] = useState<Record<string, unknown>[]>([]);
  const [latestLoading, setLatestLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [latestErr, setLatestErr] = useState<string | null>(null);
  const [historyErr, setHistoryErr] = useState<string | null>(null);
  const [runBusy, setRunBusy] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailErr, setDetailErr] = useState<string | null>(null);
  const [detailRun, setDetailRun] = useState<Record<string, unknown> | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadLatest = useCallback(async () => {
    setLatestErr(null);
    const r = await getLatestGoogleAdsAgentCheck(tenantId);
    const f = suiteFailure(r);
    if (f) {
      setLatestErr(f.error);
      setLatest(null);
      return;
    }
    if (r.ok) setLatest(r.data);
  }, [tenantId]);

  const loadHistory = useCallback(async () => {
    setHistoryErr(null);
    const r = await getGoogleAdsAgentCheckHistory(20, tenantId);
    const f = suiteFailure(r);
    if (f) {
      setHistoryErr(f.error);
      setHistoryRows([]);
      return;
    }
    if (r.ok) setHistoryRows(historyRunsFromPayload(r.data));
  }, [tenantId]);

  const refreshAll = useCallback(async () => {
    setLatestLoading(true);
    setHistoryLoading(true);
    try {
      await Promise.all([loadLatest(), loadHistory()]);
    } finally {
      setLatestLoading(false);
      setHistoryLoading(false);
    }
  }, [loadHistory, loadLatest]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  const stopPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPollIfRunning = useCallback(() => {
    stopPoll();
    pollRef.current = setInterval(() => {
      void loadLatest();
    }, 2000);
  }, [loadLatest, stopPoll]);

  useEffect(() => {
    const st = normalizeGoogleAdsCheckStatus(latest?.status ?? latest?.overall_status);
    if (st !== "running") {
      stopPoll();
      return;
    }
    startPollIfRunning();
    const maxWait = window.setTimeout(() => stopPoll(), 180000);
    return () => {
      clearTimeout(maxWait);
      stopPoll();
    };
  }, [latest, startPollIfRunning, stopPoll]);

  const handleRunCheck = async () => {
    setRunBusy(true);
    try {
      const r = await runGoogleAdsAgentCheck(tenantId);
      const f = suiteFailure(r);
      if (f) {
        setLatestErr(f.error);
        return;
      }
      if (r.ok) {
        setLatest((prev) => {
          const merged = r.data && Object.keys(r.data).length > 0 ? { ...prev, ...r.data } : prev;
          return merged;
        });
      }
    } finally {
      setRunBusy(false);
    }
    await refreshAll();
  };

  const openDetails = async (runId: string) => {
    setDrawerOpen(true);
    setDetailLoading(true);
    setDetailErr(null);
    setDetailRun(null);
    const r = await getGoogleAdsAgentCheck(runId, tenantId);
    const f = suiteFailure(r);
    setDetailLoading(false);
    if (f) {
      setDetailErr(f.error);
      return;
    }
    if (r.ok) setDetailRun(r.data);
  };

  const steps = parseSteps(latest ?? undefined);

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/admin" />

      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Search className="w-8 h-8 text-emerald-400" />
          Google Ads Agent — operational check
        </h1>
        <p className="text-gray-400 mt-1 max-w-3xl">
          Operational verification for the Google Ads Agent subsystem only. Same-origin calls to{" "}
          <code className="text-gray-500 text-xs">/api/v1/ops/google-ads-agent/checks/*</code> (proxied to the suite). Status
          labels reflect the backend; partial or no_go does not indicate production readiness.
        </p>
      </motion.div>

      <GoogleAdsAgentStatusCard
        latest={latest}
        loading={latestLoading}
        error={latestErr}
        runningAction={runBusy}
        onRunCheck={() => void handleRunCheck()}
      />

      <GlassCard className="p-6 mt-6">
        <h3 className="text-base font-semibold text-white m-0 mb-1">Latest run — step results</h3>
        <p className="text-xs text-slate-500 m-0 mb-4">Steps for the most recent check returned by the backend.</p>
        {latestLoading ? (
          <p className="text-sm text-slate-500 m-0 inline-flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </p>
        ) : latestErr && !latest ? (
          <p className="text-sm text-amber-200/90 m-0">Cannot show steps until latest run loads.</p>
        ) : steps.length === 0 ? (
          <p className="text-sm text-slate-500 m-0">No step rows on the latest run payload.</p>
        ) : (
          <ul className="space-y-2 m-0 p-0 list-none">
            {steps.map((s, i) => (
              <li key={`${s.name}-${i}`} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <span className="text-sm text-white font-medium">{s.name}</span>
                  <span className={`text-[10px] uppercase px-2 py-0.5 rounded border ${stepRowBadgeClass(s.status)}`}>
                    {s.status}
                  </span>
                </div>
                {s.detail ? <p className="text-xs text-slate-400 m-0 mt-1">{s.detail}</p> : null}
                {s.durationMs != null ? (
                  <p className="text-[10px] text-slate-600 m-0 mt-1">{s.durationMs} ms</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </GlassCard>

      <GlassCard className="p-6 mt-6">
        <h3 className="text-base font-semibold text-white m-0 mb-4">Recent run history</h3>
        <GoogleAdsAgentHistoryTable
          rows={historyRows}
          loading={historyLoading}
          error={historyErr}
          onViewDetails={(id) => void openDetails(id)}
        />
      </GlassCard>

      <GoogleAdsAgentRunDetail
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        loading={detailLoading}
        error={detailErr}
        run={detailRun}
      />
    </div>
  );
}

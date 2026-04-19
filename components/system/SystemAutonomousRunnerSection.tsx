"use client";

import { useState, useEffect, useCallback } from "react";
import {
  HeartPulse,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Loader2,
  Zap,
} from "lucide-react";
import type { AutonomousStatus, HealthRun, SystemCheck } from "@/components/system/useSystemHealth";

const API_URL = "";
const BASE = "/api/v1/system/autonomous";

async function safeGet<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${url}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function statusIcon(s: string) {
  const v = s.toLowerCase();
  if (v === "pass" || v === "ok" || v === "healthy") return <CheckCircle2 size={14} className="text-emerald-400" />;
  if (v === "warn" || v === "warning") return <AlertTriangle size={14} className="text-amber-400" />;
  return <XCircle size={14} className="text-rose-400" />;
}

function scoreColor(score: number) {
  if (score >= 85) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  return "text-rose-400";
}

function countChecks(checks: SystemCheck[]) {
  let pass = 0;
  let warn = 0;
  let fail = 0;
  for (const c of checks) {
    const v = String(c.status ?? "").toLowerCase();
    if (v === "pass" || v === "ok" || v === "healthy") pass++;
    else if (v === "warn" || v === "warning" || v === "degraded") warn++;
    else fail++;
  }
  return { pass, warn, fail };
}

/** Additive live panel: autonomous status + latest run checks + manual trigger */
export default function SystemAutonomousRunnerSection() {
  const [health, setHealth] = useState<(AutonomousStatus & {
    last_checks?: SystemCheck[];
    checks_passed?: number;
    checks_warned?: number;
    checks_failed?: number;
  }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    try {
      const [statusRes, historyRes] = await Promise.all([
        safeGet<AutonomousStatus & { error?: string }>(`${BASE}/status`),
        safeGet<{ success?: boolean; data?: HealthRun[] }>(`${BASE}/history?limit=1`),
      ]);
      if (!statusRes) {
        setHealth(null);
        return;
      }
      const latest = historyRes?.success && historyRes.data?.length ? historyRes.data[0] : null;
      const lastChecks = latest?.raw_result?.checks ?? [];
      const { pass, warn, fail } = countChecks(lastChecks);
      setHealth({
        current_score: statusRes.current_score ?? null,
        current_status: statusRes.current_status ?? "unknown",
        last_run_at: statusRes.last_run_at ?? null,
        last_run_id: statusRes.last_run_id ?? null,
        scheduler_active: !!statusRes.scheduler_active,
        next_run_in_seconds: statusRes.next_run_in_seconds ?? null,
        last_checks: lastChecks,
        checks_passed: pass,
        checks_warned: warn,
        checks_failed: fail,
      });
      setLastUpdate(new Date().toLocaleTimeString());
    } catch {
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchHealth();
    const interval = setInterval(() => void fetchHealth(), 30_000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const currentScore = health?.current_score ?? 0;

  return (
    <div className="space-y-4 mb-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-emerald-400" />
            Autonomous runner (live)
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">Real-time status · 30s refresh · manual trigger</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdate && <span className="text-xs text-slate-500">Updated {lastUpdate}</span>}
          <button
            type="button"
            onClick={() => void fetchHealth()}
            disabled={loading}
            className="p-2 rounded-lg border border-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {loading && !health && (
        <div className="flex items-center gap-2 text-slate-500 py-8 justify-center rounded-xl border border-slate-700/40 bg-white/[0.02]">
          <Loader2 size={20} className="animate-spin" />
          <span>Loading system status...</span>
        </div>
      )}

      {health && (
        <div className="space-y-4">
          <div
            className="rounded-xl border border-slate-700/40 p-5"
            style={{ backgroundColor: "rgba(15,20,40,0.8)" }}
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">System Status</p>
                <p
                  className={`text-2xl font-bold capitalize ${
                    health.current_status === "healthy"
                      ? "text-emerald-400"
                      : health.current_status === "warning"
                        ? "text-amber-400"
                        : health.current_status === "critical"
                          ? "text-rose-400"
                          : "text-slate-300"
                  }`}
                >
                  {String(health.current_status)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Scheduler: {health.scheduler_active ? "Active" : "Inactive"}
                  {health.last_run_at &&
                    ` · Last run: ${new Date(health.last_run_at).toLocaleTimeString()}`}
                </p>
              </div>
              <div className="text-center">
                <p className={`text-4xl font-bold ${scoreColor(currentScore)}`}>
                  {currentScore}
                  <span className="text-slate-500 text-lg font-normal">/100</span>
                </p>
                <div className="flex gap-3 text-xs text-slate-500 mt-1 justify-center">
                  <span className="text-emerald-400">{health.checks_passed ?? 0} pass</span>
                  <span className="text-amber-400">{health.checks_warned ?? 0} warn</span>
                  <span className="text-rose-400">{health.checks_failed ?? 0} fail</span>
                </div>
              </div>
            </div>
            <div className="mt-4 h-2 rounded-full bg-slate-700/50 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  currentScore >= 85 ? "bg-emerald-500" : currentScore >= 60 ? "bg-amber-500" : "bg-rose-500"
                }`}
                style={{ width: `${Math.min(100, Math.max(0, currentScore))}%` }}
              />
            </div>
          </div>

          {health.last_checks && health.last_checks.length > 0 && (
            <div
              className="rounded-xl border border-slate-700/40 p-4"
              style={{ backgroundColor: "rgba(15,20,40,0.8)" }}
            >
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Live Checks</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {health.last_checks.map((check, i) => (
                  <div
                    key={`${check.name}-${i}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-700/30"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {statusIcon(String(check.status ?? ""))}
                      <span className="text-sm text-slate-200 font-mono truncate">{check.name}</span>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      {typeof check.latency_ms === "number" && (
                        <span className="text-xs text-slate-500">{check.latency_ms}ms</span>
                      )}
                      {typeof check.detail === "string" && check.detail && (
                        <p className="text-xs text-slate-500 truncate max-w-32">{check.detail}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div
            className="rounded-xl border border-slate-700/40 p-4"
            style={{ backgroundColor: "rgba(15,20,40,0.8)" }}
          >
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Manual Trigger</p>
            <button
              type="button"
              onClick={async () => {
                try {
                  await fetch(`${API_URL}${BASE}/run`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ triggered_by: "dashboard", dry_run: true }),
                  });
                  setTimeout(() => void fetchHealth(), 3000);
                } catch (e) {
                  console.error(e);
                }
              }}
              className="px-4 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors flex items-center gap-2"
            >
              <Zap size={14} /> Run Health Check Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

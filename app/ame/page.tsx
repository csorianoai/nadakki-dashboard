"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Gauge } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";
import { useAMEStatus } from "@/hooks/useAMEStatus";
import { useAMERuns } from "@/hooks/useAMERuns";

function DataSourceBadge({ live }: { live: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-600 ${
        live ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/15 text-amber-200"
      }`}
    >
      {live ? "Live" : "Reference"}
    </span>
  );
}

function chipClass(kind: "blue" | "gray" | "green" | "red" | "yellow") {
  const map = {
    blue: "bg-sky-500/20 text-sky-200",
    gray: "bg-slate-600/40 text-slate-200",
    green: "bg-emerald-500/20 text-emerald-300",
    red: "bg-rose-500/20 text-rose-200",
    yellow: "bg-amber-500/20 text-amber-200",
  };
  return `inline-flex rounded-full px-2 py-0.5 text-xs font-600 ${map[kind]}`;
}

function modeBadge(mode: string) {
  const m = (mode || "").toLowerCase();
  if (m === "dry_run") return <span className={chipClass("gray")}>Dry Run</span>;
  if (m === "live") return <span className={chipClass("green")}>Live</span>;
  return <span className={chipClass("yellow")}>Unknown</span>;
}

function overallBadge(overall: string) {
  const o = (overall || "").toLowerCase();
  if (o === "running") return <span className={chipClass("blue")}>Running</span>;
  if (o === "idle") return <span className={chipClass("gray")}>Idle</span>;
  if (o === "degraded") return <span className={chipClass("red")}>Degraded</span>;
  return <span className={chipClass("yellow")}>Unknown</span>;
}

function resultChip(result: string) {
  const r = (result || "").toLowerCase();
  if (["success", "completed", "ok"].some((x) => r.includes(x)))
    return <span className={chipClass("green")}>{result || "OK"}</span>;
  if (["fail", "error"].some((x) => r.includes(x)))
    return <span className={chipClass("red")}>{result || "Failed"}</span>;
  if (["block", "partial", "skip"].some((x) => r.includes(x)))
    return <span className={chipClass("yellow")}>{result || "Partial"}</span>;
  return <span className={chipClass("gray")}>{result || "—"}</span>;
}

function actionStatusChip(status: string) {
  const s = (status || "").toLowerCase();
  if (s === "completed") return <span className={chipClass("green")}>completed</span>;
  if (s === "blocked") return <span className={chipClass("red")}>blocked</span>;
  if (s === "skipped") return <span className={chipClass("yellow")}>skipped</span>;
  if (s === "failed") return <span className={chipClass("red")}>failed</span>;
  return <span className={chipClass("gray")}>{status || "—"}</span>;
}

function fmtTime(iso: unknown): string {
  if (typeof iso !== "string" || !iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString();
}

function fmtDuration(start: unknown, end: unknown): string {
  if (typeof start !== "string" || !start) return "—";
  const a = new Date(start).getTime();
  if (Number.isNaN(a)) return "—";
  const b =
    typeof end === "string" && end
      ? new Date(end).getTime()
      : NaN;
  if (Number.isNaN(b)) return "In progress";
  const sec = Math.max(0, Math.round((b - a) / 1000));
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

function str(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v);
}

function getRunField(run: Record<string, unknown>, keys: string[]): unknown {
  for (const k of keys) {
    if (k in run && run[k] != null) return run[k];
  }
  return undefined;
}

function runResult(run: Record<string, unknown>): string {
  const raw =
    getRunField(run, ["result", "status", "outcome", "state"]) ?? "";
  return str(raw);
}

export default function AMEPage() {
  const { tenantId } = useTenant();
  const envTenant =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID
      : undefined;
  const [tenantOverride, setTenantOverride] = useState<string | null>(null);
  const [tenantOptions, setTenantOptions] = useState<
    { slug: string; label: string }[]
  >([]);

  const effectiveTenant =
    tenantOverride?.trim() ||
    tenantId?.trim() ||
    envTenant?.trim() ||
    undefined;

  const {
    data: status,
    source: statusSource,
    loading: statusLoading,
    refetch: refetchStatus,
  } = useAMEStatus(effectiveTenant);
  const {
    data: runs,
    source: runsSource,
    loading: runsLoading,
    refetch: refetchRuns,
  } = useAMERuns(effectiveTenant);

  const loading = statusLoading || runsLoading;
  const dataLive = statusSource === "live" && runsSource === "live";

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/tenants", { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        const list =
          json?.data?.tenants ?? json?.tenants ?? json?.data ?? json ?? [];
        const normalized = (Array.isArray(list) ? list : [])
          .map((t: Record<string, unknown>) => ({
            slug: String(t.slug ?? t.tenant_id ?? t.id ?? t.name ?? ""),
            label: String(t.display_name ?? t.name ?? t.slug ?? ""),
          }))
          .filter((t: { slug: string }) => t.slug);
        if (alive) setTenantOptions(normalized);
      } catch {
        /* keep empty */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const onRefresh = useCallback(async () => {
    const ac = new AbortController();
    await Promise.all([refetchStatus(ac.signal), refetchRuns(ac.signal)]);
  }, [refetchStatus, refetchRuns]);

  const ame = status.ame as Record<string, unknown> | undefined;
  const overallStatus = str(ame?.overall_status);
  const mode = str(ame?.mode);
  const tenantLabel = str(ame?.tenant);
  const environment = str(ame?.environment);

  const lastRun = status.last_run as Record<string, unknown> | null | undefined;
  const kpis = status.kpis as Record<string, unknown> | undefined;

  const kpiLastRun = lastRun?.started_at
    ? fmtTime(lastRun.started_at)
    : "No runs yet";
  const kpiRunsTotal =
    typeof runs.total === "number" ? String(runs.total) : "—";
  const kpiActions =
    typeof kpis?.actions_executed === "number"
      ? String(kpis.actions_executed)
      : "—";
  const kpiBlocked =
    typeof kpis?.actions_blocked === "number"
      ? String(kpis.actions_blocked)
      : "—";
  const kpiPhasesOk =
    typeof kpis?.phases_ok === "number" ? String(kpis.phases_ok) : "—";
  const kpiPhasesFail =
    typeof kpis?.phases_fail === "number" ? String(kpis.phases_fail) : "—";

  const actionsFeed = Array.isArray(runs.actions_feed)
    ? (runs.actions_feed as Record<string, unknown>[])
    : [];
  const displayActions = actionsFeed.slice(0, 15);

  const sortedRuns = useMemo(() => {
    const runsList = Array.isArray(runs.runs)
      ? ([...runs.runs] as Record<string, unknown>[])
      : [];
    return runsList.sort((a, b) => {
      const ta = new Date(
        str(getRunField(a, ["started_at", "start", "time"]))
      ).getTime();
      const tb = new Date(
        str(getRunField(b, ["started_at", "start", "time"]))
      ).getTime();
      return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta);
    });
  }, [runs.runs]);
  const displayRuns = sortedRuns.slice(0, 10);

  const gatesObj =
    (status.gates as { gates?: Record<string, unknown> } | undefined)?.gates ??
    {};
  const gateEntries = Object.keys(gatesObj).length
    ? Object.entries(gatesObj)
    : [];

  const scheduler = (status.scheduler ?? {}) as Record<string, unknown>;

  const showTenantFilter = tenantOptions.length > 1;

  return (
    <div className="min-h-screen bg-[#0a0f1c] p-6 text-slate-100">
      {/* Section 1 */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Gauge className="h-7 w-7 text-orange-400" aria-hidden />
            <h1 className="m-0 text-2xl font-800 text-slate-100">
              Autopilot (AME)
            </h1>
            <DataSourceBadge live={dataLive} />
          </div>
          <p className="m-0 text-sm text-slate-500">
            Tenant: {tenantLabel || "—"} · Environment: {environment || "—"}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-slate-500">
              Mode
            </span>
            {modeBadge(mode)}
            <span className="text-xs uppercase tracking-wide text-slate-500">
              Overall
            </span>
            {overallBadge(overallStatus)}
          </div>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          {showTenantFilter && (
            <label className="flex flex-col gap-1 text-xs text-slate-400">
              Tenant (header)
              <select
                className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                value={tenantOverride ?? tenantId ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setTenantOverride(v || null);
                }}
              >
                <option value="">—</option>
                {tenantOptions.map((t) => (
                  <option key={t.slug} value={t.slug}>
                    {t.label || t.slug}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button
            type="button"
            onClick={() => void onRefresh()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-600 text-slate-100 hover:bg-slate-700 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              aria-hidden
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Section 2 */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Last Run", value: kpiLastRun },
          { label: "Runs Total", value: kpiRunsTotal },
          { label: "Actions", value: kpiActions },
          { label: "Blocked", value: kpiBlocked },
          { label: "Phases OK", value: kpiPhasesOk },
          {
            label: "Phases Fail",
            value: kpiPhasesFail,
            danger:
              typeof kpis?.phases_fail === "number" && kpis.phases_fail > 0,
          },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-4"
          >
            <div className="text-xs font-600 uppercase tracking-wide text-slate-500">
              {c.label}
            </div>
            <div
              className={`mt-1 text-lg font-700 ${
                "danger" in c && c.danger ? "text-rose-400" : "text-slate-100"
              }`}
            >
              {c.value}
            </div>
          </div>
        ))}
      </div>

      {/* Section 3 */}
      <section className="mb-6 rounded-xl border border-slate-700/50 bg-slate-900/50 p-5">
        <h2 className="mt-0 text-base font-700 text-slate-200">Last run</h2>
        {!lastRun ? (
          <p className="m-0 text-sm text-slate-500">
            No runs recorded yet. Run the pilot to see data here.
          </p>
        ) : (
          <div className="grid gap-2 text-sm md:grid-cols-2">
            <div>
              <span className="text-slate-500">Run ID</span>{" "}
              <span className="text-slate-200">
                {str(getRunField(lastRun, ["id", "run_id", "runId"])) || "—"}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Started</span>{" "}
              <span className="text-slate-200">
                {fmtTime(getRunField(lastRun, ["started_at", "start"]))}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Ended</span>{" "}
              <span className="text-slate-200">
                {getRunField(lastRun, ["ended_at", "end"])
                  ? fmtTime(getRunField(lastRun, ["ended_at", "end"]))
                  : "In progress"}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Duration</span>{" "}
              <span className="text-slate-200">
                {fmtDuration(
                  getRunField(lastRun, ["started_at", "start"]),
                  getRunField(lastRun, ["ended_at", "end"])
                )}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Mode</span>{" "}
              {modeBadge(
                str(getRunField(lastRun, ["mode", "run_mode"])) || mode
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-500">Result</span>
              {resultChip(runResult(lastRun))}
            </div>
            <div>
              <span className="text-slate-500">Tenant</span>{" "}
              <span className="text-slate-200">
                {str(getRunField(lastRun, ["tenant", "tenant_id"])) || tenantLabel || "—"}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Phases</span>{" "}
              <span className="text-slate-200">
                {typeof getRunField(lastRun, ["phase_count", "phases"]) ===
                "number"
                  ? String(getRunField(lastRun, ["phase_count"]))
                  : Array.isArray(getRunField(lastRun, ["phases"]))
                    ? String(
                        (getRunField(lastRun, ["phases"]) as unknown[]).length
                      )
                    : "—"}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Actions</span>{" "}
              <span className="text-slate-200">
                {typeof getRunField(lastRun, ["action_count", "actions"]) ===
                "number"
                  ? String(getRunField(lastRun, ["action_count"]))
                  : Array.isArray(getRunField(lastRun, ["actions"]))
                    ? String(
                        (getRunField(lastRun, ["actions"]) as unknown[]).length
                      )
                    : "—"}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Section 4 */}
      <section className="mb-6 rounded-xl border border-slate-700/50 bg-slate-900/50 p-5">
        <h2 className="mt-0 text-base font-700 text-slate-200">
          Actions feed
        </h2>
        {displayActions.length === 0 ? (
          <p className="m-0 text-sm text-slate-500">
            No actions recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-xs uppercase text-slate-500">
                  <th className="py-2 pr-3">Time</th>
                  <th className="py-2 pr-3">Campaign / Entity</th>
                  <th className="py-2 pr-3">Action</th>
                  <th className="py-2 pr-3">Platform</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2">Reason</th>
                </tr>
              </thead>
              <tbody>
                {displayActions.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-slate-800/80 text-slate-300"
                  >
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {fmtTime(
                        getRunField(row, ["time", "at", "timestamp", "ts"])
                      )}
                    </td>
                    <td className="py-2 pr-3">
                      {str(
                        getRunField(row, [
                          "campaign",
                          "entity",
                          "campaign_id",
                          "entity_id",
                        ])
                      ) || "—"}
                    </td>
                    <td className="py-2 pr-3">
                      {str(getRunField(row, ["action", "action_type"])) || "—"}
                    </td>
                    <td className="py-2 pr-3">
                      {str(getRunField(row, ["platform", "channel"])) || "—"}
                    </td>
                    <td className="py-2 pr-3">
                      {actionStatusChip(
                        str(getRunField(row, ["status", "state"])) || "—"
                      )}
                    </td>
                    <td className="py-2 text-slate-400">
                      {str(
                        getRunField(row, ["reason", "message", "detail"])
                      ) || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Section 5 */}
      <section className="mb-6 rounded-xl border border-slate-700/50 bg-slate-900/50 p-5">
        <h2 className="mt-0 text-base font-700 text-slate-200">
          Gates status
        </h2>
        {gateEntries.length === 0 ? (
          <p className="m-0 text-sm text-slate-500">
            Gates state unavailable — showing reference.
          </p>
        ) : (
          <ul className="m-0 list-none space-y-3 p-0">
            {typeof gatesObj.meta_live_enabled === "boolean" && (
              <li className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-slate-400">meta_live_enabled</span>
                <span
                  className={chipClass(
                    gatesObj.meta_live_enabled ? "green" : "red"
                  )}
                >
                  {gatesObj.meta_live_enabled ? "enabled" : "disabled"}
                </span>
              </li>
            )}
            {"circuit_breaker_threshold" in gatesObj && (
              <li className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-slate-400">circuit_breaker</span>
                <span className="text-slate-200">
                  threshold:{" "}
                  {str(gatesObj.circuit_breaker_threshold) || "—"}
                </span>
              </li>
            )}
            {("rate_limit_max" in gatesObj ||
              "rate_limit_window_s" in gatesObj) && (
              <li className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-slate-400">rate_limit</span>
                <span className="text-slate-200">
                  max {str(gatesObj.rate_limit_max) ?? "—"} / window{" "}
                  {str(gatesObj.rate_limit_window_s) ?? "—"}s
                </span>
              </li>
            )}
            {typeof gatesObj.global_autonomy === "boolean" && (
              <li className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-slate-400">global_autonomy</span>
                <span
                  className={chipClass(
                    gatesObj.global_autonomy ? "green" : "red"
                  )}
                >
                  {gatesObj.global_autonomy ? "enabled" : "disabled"}
                </span>
              </li>
            )}
            {gateEntries
              .filter(
                ([k]) =>
                  ![
                    "meta_live_enabled",
                    "circuit_breaker_threshold",
                    "rate_limit_max",
                    "rate_limit_window_s",
                    "global_autonomy",
                  ].includes(k)
              )
              .map(([k, v]) => (
                <li
                  key={k}
                  className="flex flex-wrap items-center gap-2 text-sm"
                >
                  <span className="text-slate-400">{k}</span>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
                    {typeof v === "object" ? JSON.stringify(v) : str(v)}
                  </span>
                </li>
              ))}
          </ul>
        )}
      </section>

      {/* Section 6 */}
      <section className="mb-6 rounded-xl border border-slate-700/50 bg-slate-900/50 p-5">
        <h2 className="mt-0 text-base font-700 text-slate-200">Scheduler</h2>
        {!scheduler || Object.keys(scheduler).length === 0 ? (
          <p className="m-0 text-sm text-slate-500">
            Scheduler state not available.
          </p>
        ) : (
          <div className="space-y-2 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-400">Enabled</span>
              <span
                className={chipClass(
                  scheduler.enabled === true
                    ? "green"
                    : scheduler.enabled === false
                      ? "gray"
                      : "yellow"
                )}
              >
                {scheduler.enabled === true
                  ? "YES"
                  : scheduler.enabled === false
                    ? "NO"
                    : "UNKNOWN"}
              </span>
            </div>
            {"source" in scheduler && (
              <div>
                <span className="text-slate-400">Source</span>{" "}
                <span className="text-slate-200">{str(scheduler.source)}</span>
              </div>
            )}
            {Object.entries(scheduler)
              .filter(([k]) => k !== "enabled" && k !== "source")
              .map(([k, v]) => (
                <div key={k}>
                  <span className="text-slate-400">{k}</span>{" "}
                  <span className="text-slate-200">
                    {typeof v === "object" ? JSON.stringify(v) : str(v)}
                  </span>
                </div>
              ))}
          </div>
        )}
      </section>

      {/* Section 7 */}
      <section className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-5">
        <h2 className="mt-0 text-base font-700 text-slate-200">
          Recent runs
        </h2>
        {displayRuns.length === 0 ? (
          <p className="m-0 text-sm text-slate-500">
            No run history available.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-xs uppercase text-slate-500">
                  <th className="py-2 pr-3">Run ID</th>
                  <th className="py-2 pr-3">Time</th>
                  <th className="py-2 pr-3">Mode</th>
                  <th className="py-2 pr-3">Result</th>
                  <th className="py-2 pr-3">Phases</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayRuns.map((run, i) => (
                  <tr
                    key={str(getRunField(run, ["id", "run_id"])) || i}
                    className="border-b border-slate-800/80 text-slate-300"
                  >
                    <td className="py-2 pr-3 font-mono text-xs">
                      {str(getRunField(run, ["id", "run_id", "runId"])) || "—"}
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {fmtTime(
                        getRunField(run, ["started_at", "start", "time"])
                      )}
                    </td>
                    <td className="py-2 pr-3">
                      {modeBadge(str(getRunField(run, ["mode", "run_mode"])))}
                    </td>
                    <td className="py-2 pr-3">{resultChip(runResult(run))}</td>
                    <td className="py-2 pr-3">
                      {typeof getRunField(run, ["phase_count", "phases"]) ===
                      "number"
                        ? String(getRunField(run, ["phase_count"]))
                        : Array.isArray(getRunField(run, ["phases"]))
                          ? String(
                              (getRunField(run, ["phases"]) as unknown[])
                                .length
                            )
                          : "—"}
                    </td>
                    <td className="py-2">
                      {typeof getRunField(run, ["action_count", "actions"]) ===
                      "number"
                        ? String(getRunField(run, ["action_count"]))
                        : Array.isArray(getRunField(run, ["actions"]))
                          ? String(
                              (getRunField(run, ["actions"]) as unknown[])
                                .length
                            )
                          : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

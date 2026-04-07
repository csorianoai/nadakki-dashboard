"use client";

import {
  getCreditHealth,
  getCreditStats,
  listCreditApplications,
} from "@/app/hooks/useCredit";
import { CreditTenantGate } from "@/app/credit/CreditTenantGate";
import Link from "next/link";
import { useEffect, useState } from "react";

const MODES = {
  AI_ONLY: {
    label: "AI Underwriting",
    color:
      "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-200 dark:border-purple-800",
    badge: "bg-purple-600",
    description:
      "Nadakki analyzes bank statements and scores the application autonomously.",
    icon: "\u{1F916}",
  },
  BANK_ONLY: {
    label: "Bank Submission",
    color:
      "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-800",
    badge: "bg-blue-600",
    description:
      "Application is submitted to the configured bank adapter for evaluation.",
    icon: "\u{1F3E6}",
  },
  HYBRID: {
    label: "Hybrid (AI + Bank)",
    color:
      "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800",
    badge: "bg-emerald-600",
    description:
      "AI pre-screens and optimizes before the bank adapter completes the decision.",
    icon: "\u26A1",
  },
} as const;

function normalizeApplicationList(
  data: { applications?: unknown[]; items?: unknown[] } | null
): unknown[] {
  if (!data) return [];
  if (Array.isArray(data.applications)) return data.applications;
  if (Array.isArray(data.items)) return data.items;
  return [];
}

function pickNum(
  obj: Record<string, unknown> | null,
  ...keys: string[]
): number | null {
  if (!obj) return null;
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "number" && !Number.isNaN(v)) return v;
    if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) {
      return Number(v);
    }
  }
  return null;
}

function pickAiOnlyCount(
  stats: Record<string, unknown> | null
): number | null {
  const direct = pickNum(
    stats,
    "ai_only",
    "ai_only_count",
    "applications_ai_only",
    "AI_ONLY"
  );
  if (direct !== null) return direct;
  const by = stats?.by_mode ?? stats?.byMode ?? stats?.modes;
  if (by && typeof by === "object" && !Array.isArray(by)) {
    const b = by as Record<string, unknown>;
    for (const key of ["AI_ONLY", "ai_only"]) {
      const v = b[key];
      if (typeof v === "number" && !Number.isNaN(v)) return v;
    }
  }
  return null;
}

function fmtDash(n: number | null, suffix = ""): string {
  if (n === null) return "\u2014";
  return suffix ? `${n}${suffix}` : String(n);
}

function fmtApprovalRate(n: number | null): string {
  if (n === null) return "\u2014";
  const pct = n <= 1 && n >= 0 ? n * 100 : n;
  const rounded = Math.round(pct * 10) / 10;
  return `${rounded}%`;
}

function fmtAvgScore(n: number | null): string {
  if (n === null) return "\u2014";
  const rounded = Math.round(n * 10) / 10;
  return String(rounded);
}

type AppRow = {
  id: string;
  mode: string;
  state: string;
  events: number | null;
  created: string | null;
};

function normalizeAppRow(raw: unknown): AppRow | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = String(o.application_id ?? o.id ?? o.applicationId ?? "").trim();
  if (!id) return null;
  let mode = "\u2014";
  const payload = o.application_payload;
  if (payload && typeof payload === "object") {
    const p = payload as Record<string, unknown>;
    if (p.mode != null) mode = String(p.mode);
  }
  if (mode === "\u2014" && o.mode != null) mode = String(o.mode);
  const state = String(o.state ?? o.status ?? "\u2014");
  let events: number | null = null;
  if (typeof o.event_count === "number") events = o.event_count;
  else if (typeof o.events_count === "number") events = o.events_count;
  else if (typeof o.events === "number") events = o.events;
  const c = o.created_at ?? o.created ?? o.submitted_at ?? o.inserted_at;
  const created = c != null ? String(c) : null;
  return { id, mode, state, events, created };
}

function parseCreatedMs(s: string | null): number {
  if (!s) return 0;
  const t = Date.parse(s);
  return Number.isNaN(t) ? 0 : t;
}

function CreditOverviewBody({ tenantId }: { tenantId: string }) {
  const [health, setHealth] = useState<"checking" | "ok" | "error">(
    "checking"
  );
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [apps, setApps] = useState<AppRow[]>([]);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [listFetchFailed, setListFetchFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setHealth("checking");
    (async () => {
      try {
        const r = await getCreditHealth(tenantId);
        if (!cancelled) setHealth(r.ok ? "ok" : "error");
      } catch {
        if (!cancelled) setHealth("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  useEffect(() => {
    let cancelled = false;
    setOverviewLoading(true);
    setListFetchFailed(false);
    (async () => {
      try {
        const [listData, statsData] = await Promise.all([
          listCreditApplications(tenantId),
          getCreditStats(tenantId),
        ]);
        if (cancelled) return;
        setListFetchFailed(listData === null);
        setStats(statsData ?? null);
        const raw = normalizeApplicationList(listData);
        const parsed = raw
          .map(normalizeAppRow)
          .filter((r): r is AppRow => r !== null);
        parsed.sort(
          (a, b) => parseCreatedMs(b.created) - parseCreatedMs(a.created)
        );
        setApps(parsed.slice(0, 25));
      } catch {
        if (!cancelled) {
          setListFetchFailed(true);
          setStats(null);
          setApps([]);
        }
      } finally {
        if (!cancelled) setOverviewLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  const totalApps = pickNum(
    stats,
    "total_applications",
    "totalApplications",
    "total_count",
    "count",
    "applications_total"
  );
  const approvalRate = pickNum(
    stats,
    "approval_rate",
    "approvalRate",
    "approved_rate",
    "approve_rate"
  );
  const avgScore = pickNum(
    stats,
    "avg_score",
    "average_score",
    "avgScore",
    "mean_score",
    "score_avg"
  );
  const aiOnly = pickAiOnlyCount(stats);

  const statCards: {
    label: string;
    value: string;
  }[] = [
    { label: "Total Applications", value: fmtDash(totalApps) },
    { label: "Approval Rate", value: fmtApprovalRate(approvalRate) },
    { label: "Avg Score", value: fmtAvgScore(avgScore) },
    { label: "AI Only", value: fmtDash(aiOnly) },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Credit Core
          </h1>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              health === "ok"
                ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                : health === "error"
                  ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                  : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
            }`}
          >
            {health === "ok"
              ? "\u25CF Online"
              : health === "error"
                ? "\u25CF Offline"
                : "\u25CF Checking\u2026"}
          </span>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Tenant:{" "}
          <span className="font-mono text-xs" title="X-Tenant-ID">
            {tenantId}
          </span>
          {" — "}
          Multi-tenant credit evaluation (live API).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {(
          Object.entries(MODES) as [
            keyof typeof MODES,
            (typeof MODES)[keyof typeof MODES],
          ][]
        ).map(([mode, config]) => (
          <Link
            key={mode}
            href={`/credit/new?mode=${mode}`}
            className={`rounded-xl border p-5 hover:shadow-md transition-shadow cursor-pointer ${config.color}`}
          >
            <div className="text-2xl mb-3">{config.icon}</div>
            <div className="font-semibold text-sm mb-1">{config.label}</div>
            <p className="text-xs opacity-75 leading-relaxed">
              {config.description}
            </p>
            <div className="mt-4">
              <span
                className={`text-white text-xs px-3 py-1 rounded-full ${config.badge}`}
              >
                Start →
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {overviewLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4 animate-pulse"
              >
                <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            ))}
          </>
        ) : (
          statCards.map((c) => (
            <div
              key={c.label}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 p-4"
            >
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                {c.label}
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                {c.value}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Recent applications
          </h2>
          {listFetchFailed && !overviewLoading && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              Could not refresh application list. You can still create a new
              one.
            </p>
          )}
        </div>
        {overviewLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">
            {"Loading applications…"}
          </div>
        ) : apps.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Start First Application
            </p>
            <Link
              href="/credit/new"
              className="inline-block bg-gray-900 dark:bg-gray-100 dark:text-gray-900 text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors"
            >
              New Application
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-xs text-gray-500 dark:text-gray-400">
                  <th className="px-4 py-2 font-medium">ID</th>
                  <th className="px-4 py-2 font-medium">Mode</th>
                  <th className="px-4 py-2 font-medium">State</th>
                  <th className="px-4 py-2 font-medium">Events</th>
                  <th className="px-4 py-2 font-medium">Created</th>
                  <th className="px-4 py-2 font-medium">View</th>
                </tr>
              </thead>
              <tbody>
                {apps.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-200"
                  >
                    <td className="px-4 py-2 font-mono text-xs max-w-[140px] truncate">
                      {row.id}
                    </td>
                    <td className="px-4 py-2">{row.mode}</td>
                    <td className="px-4 py-2">{row.state}</td>
                    <td className="px-4 py-2 tabular-nums">
                      {row.events === null ? "\u2014" : String(row.events)}
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {row.created
                        ? new Date(row.created).toLocaleString()
                        : "\u2014"}
                    </td>
                    <td className="px-4 py-2">
                      <Link
                        href={`/credit/${encodeURIComponent(row.id)}`}
                        className="text-violet-600 dark:text-violet-400 font-medium hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {apps.length > 0 && (
        <div className="text-center">
          <Link
            href="/credit/new"
            className="inline-block bg-gray-900 dark:bg-gray-100 dark:text-gray-900 text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors"
          >
            New Application
          </Link>
        </div>
      )}
    </div>
  );
}

export default function CreditOverviewPage() {
  return (
    <CreditTenantGate>
      {(tenantId) => <CreditOverviewBody tenantId={tenantId} />}
    </CreditTenantGate>
  );
}

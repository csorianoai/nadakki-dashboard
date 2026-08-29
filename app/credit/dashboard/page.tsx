// COPIA SIN ENLACE. La viva es app/(forge)/credit-hub/**
"use client";

/**
 * Credit Operational Dashboard — TP-CAP11-015D Phase 3
 *
 * 4 big-number KPI cards:
 *   1. Total Applications
 *   2. Total Offers
 *   3. Approved % (APPROVED / total applications)
 *   4. Failures (last 24 h)
 *
 * 2 bar charts (recharts):
 *   A. Offers by Lender
 *   B. Applications by Status
 *
 * PROHIBITED: time-series, alerts, webhooks, per-application drill-down
 */

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, FileText, Percent, TrendingUp } from "lucide-react";
import { KpiCard } from "@/components/forge";
import { ForgeCard } from "@/components/credit-hub/primitives/ForgeCard";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";
import { CreditTenantGate } from "@/app/credit/CreditTenantGate";

// ── Types ────────────────────────────────────────────────────────────────────

interface DashboardSummary {
  applications_total: number;
  applications_by_status: Record<string, number>;
  offers_total: number;
  offers_by_lender: Record<string, number>;
  recent_failures_24h: number;
}

interface DashboardResponse {
  tenant_id: string;
  summary: DashboardSummary;
  generated_at: string;
}

type FetchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: DashboardResponse }
  | { status: "error"; message: string };

// ── Colour palette for charts ─────────────────────────────────────────────────

const LENDER_COLOURS = [
  "#ff6b35",
  "#22c55e",
  "#3b82f6",
  "#f59e0b",
  "#a855f7",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
];

const STATUS_COLOURS: Record<string, string> = {
  DRAFT: "#94a3b8",
  SUBMITTED: "#3b82f6",
  PROCESSING: "#f59e0b",
  APPROVED: "#22c55e",
  REJECTED: "#ef4444",
  EXPIRED: "#6b7280",
  FAILED: "#dc2626",
};

function statusColour(status: string): string {
  return STATUS_COLOURS[status] ?? "#94a3b8";
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function approvedPct(summary: DashboardSummary): string {
  const approved = summary.applications_by_status["APPROVED"] ?? 0;
  if (summary.applications_total === 0) return "—";
  return `${((approved / summary.applications_total) * 100).toFixed(1)}%`;
}

function toBarData(record: Record<string, number>) {
  return Object.entries(record)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

// ── Fetch hook ────────────────────────────────────────────────────────────────

function useDashboardSummary(tenantId: string | null) {
  const [state, setState] = useState<FetchState>({ status: "idle" });

  useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;

    setState({ status: "loading" });

    fetch("/credit/dashboard/summary", {
      headers: { "X-Tenant-ID": tenantId },
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.detail ?? `HTTP ${res.status}`);
        }
        return res.json() as Promise<DashboardResponse>;
      })
      .then((data) => {
        if (!cancelled) setState({ status: "success", data });
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setState({
            status: "error",
            message: err instanceof Error ? err.message : String(err),
          });
      });

    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  return state;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function KpiSkeleton() {
  return (
    <div className="rounded-forge-md border border-forgeGray-200 bg-forgeSurface-card p-5 animate-pulse h-28" />
  );
}

function ChartSkeleton() {
  return (
    <div className="rounded-forge-md border border-forgeGray-200 bg-forgeSurface-card p-5 animate-pulse h-72" />
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CreditDashboardPage() {
  const { tenantId } = useTenant();
  const fetchState = useDashboardSummary(tenantId);

  const isLoading = fetchState.status === "loading" || fetchState.status === "idle";
  const isError = fetchState.status === "error";
  const summary = fetchState.status === "success" ? fetchState.data.summary : null;
  const generatedAt =
    fetchState.status === "success"
      ? new Date(fetchState.data.generated_at).toLocaleString()
      : null;

  const lenderBarData = summary ? toBarData(summary.offers_by_lender) : [];
  const statusBarData = summary
    ? toBarData(summary.applications_by_status)
    : [];

  return (
    <CreditTenantGate>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div>
          <p className="text-xs uppercase tracking-widest text-forge-primary font-semibold">
            Credit Hub
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold text-forge-text">
            Operational Dashboard
          </h1>
          {generatedAt && (
            <p className="mt-1 text-xs text-forgeGray-500">
              Last updated: {generatedAt}
            </p>
          )}
        </div>

        {/* Error banner */}
        {isError && (
          <div className="flex items-center gap-3 rounded-forge-md border border-forgeDanger-200 bg-forgeDanger-50 p-4 text-forgeDanger-700">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span className="text-sm font-medium">
              {(fetchState as { status: "error"; message: string }).message}
            </span>
          </div>
        )}

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {isLoading ? (
            <>
              <KpiSkeleton />
              <KpiSkeleton />
              <KpiSkeleton />
              <KpiSkeleton />
            </>
          ) : (
            <>
              <KpiCard
                label="Total Applications"
                value={summary?.applications_total ?? 0}
                icon={FileText}
              />
              <KpiCard
                label="Total Offers"
                value={summary?.offers_total ?? 0}
                icon={TrendingUp}
              />
              <KpiCard
                label="Approved %"
                value={summary ? approvedPct(summary) : "—"}
                icon={Percent}
              />
              <KpiCard
                label="Failures (24 h)"
                value={summary?.recent_failures_24h ?? 0}
                icon={AlertTriangle}
              />
            </>
          )}
        </div>

        {/* ── Charts ── */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Chart A — Offers by Lender */}
          {isLoading ? (
            <ChartSkeleton />
          ) : (
            <ForgeCard>
              <h3 className="mb-4 font-semibold text-forge-text">
                Offers by Lender
              </h3>
              {lenderBarData.length === 0 ? (
                <div className="flex h-64 items-center justify-center text-sm text-forgeGray-400">
                  No offers yet
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={lenderBarData}
                      margin={{ top: 4, right: 8, left: 0, bottom: 24 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11 }}
                        angle={-25}
                        textAnchor="end"
                        interval={0}
                      />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          fontSize: 12,
                          borderRadius: 6,
                          border: "1px solid #e2e8f0",
                        }}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {lenderBarData.map((_, index) => (
                          <Cell
                            key={index}
                            fill={LENDER_COLOURS[index % LENDER_COLOURS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ForgeCard>
          )}

          {/* Chart B — Applications by Status */}
          {isLoading ? (
            <ChartSkeleton />
          ) : (
            <ForgeCard>
              <h3 className="mb-4 font-semibold text-forge-text">
                Applications by Status
              </h3>
              {statusBarData.length === 0 ? (
                <div className="flex h-64 items-center justify-center text-sm text-forgeGray-400">
                  No applications yet
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={statusBarData}
                      margin={{ top: 4, right: 8, left: 0, bottom: 24 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11 }}
                        angle={-25}
                        textAnchor="end"
                        interval={0}
                      />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          fontSize: 12,
                          borderRadius: 6,
                          border: "1px solid #e2e8f0",
                        }}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {statusBarData.map((entry, index) => (
                          <Cell
                            key={index}
                            fill={statusColour(entry.name)}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ForgeCard>
          )}
        </div>
      </div>
    </CreditTenantGate>
  );
}

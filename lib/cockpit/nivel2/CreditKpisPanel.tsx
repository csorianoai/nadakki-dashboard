"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchCreditDashboard } from "../api/creditHub";
import { useCockpit } from "../context";
import { DemoPanelBadge } from "../components/DemoPanelBadge";
import { CockpitErrorBoundary } from "../components/ErrorBoundary";
import { PanelError, PanelFrame, PanelSkeleton } from "../components/PanelFrame";
import type { CreditDashboardResponse } from "../types-credit";

const PIE_COLORS = ["#2563eb", "#22c55e", "#ef4444", "#eab308", "#8b5cf6"];

function formatMoney(amount: number, locale: string, currency: string): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export function CreditKpisPanel() {
  const { locale, currency } = useCockpit();
  const [data, setData] = useState<CreditDashboardResponse | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchCreditDashboard();
      setData(res.data);
      setIsDemo(res.isDemo);
      if (res.error) setError(res.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const moneyFmt = useMemo(() => (n: number) => formatMoney(n, locale, currency), [locale, currency]);

  return (
    <CockpitErrorBoundary title="KPIs Credit Hub">
      <PanelFrame title="Indicadores Credit Hub" badge={isDemo ? <DemoPanelBadge /> : undefined}>
        {loading ? <PanelSkeleton rows={3} /> : null}
        {!loading && error && !data ? <PanelError message={error} onRetry={load} /> : null}
        {!loading && data ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {(data.kpis ?? []).map((k) => (
                <div key={k.key}>
                  <p className="text-xs text-[var(--ch-text-3)]">{k.label}</p>
                  <p className="text-lg font-semibold">
                    {k.unit === "DOP" || k.key.includes("amount") ? moneyFmt(Number(k.value)) : `${k.value ?? "—"}${k.unit === "%" ? "%" : ""}`}
                  </p>
                </div>
              ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <ChartBox title="Tendencia semanal">
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={data.weekly_trend ?? []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartBox>
              <ChartBox title="Por estado">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={data.status_distribution ?? []} dataKey="count" nameKey="state" innerRadius={40} outerRadius={70}>
                      {(data.status_distribution ?? []).map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </ChartBox>
              <ChartBox title="Monto mensual">
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={data.monthly_amounts ?? []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" fontSize={11} />
                    <YAxis fontSize={11} tickFormatter={(v) => moneyFmt(v).replace(/\s/g, "")} />
                    <Tooltip formatter={(v: number) => moneyFmt(v)} />
                    <Bar dataKey="amount" fill="#2563eb" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartBox>
            </div>
          </div>
        ) : null}
      </PanelFrame>
    </CockpitErrorBoundary>
  );
}

function ChartBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded border border-[var(--ch-line)] p-2">
      <p className="mb-2 text-xs font-medium text-[var(--ch-text-2)]">{title}</p>
      {children}
    </div>
  );
}

"use client";

import Link from "next/link";
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
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import { resolveCreditHubFetchUrl } from "@/lib/credit-hub/api/client";
import {
  buildRequestsQuery,
  fetchCreditAml,
  fetchCreditAudit,
  fetchCreditDashboard,
  fetchCreditRequests,
  fetchDealerRanking,
} from "@/lib/cockpit/api/creditHub";
import { CockpitErrorBoundary } from "@/lib/cockpit/components/ErrorBoundary";
import { useCockpit } from "@/lib/cockpit/context";
import type { CreditRequestFilters, CreditRequestRow } from "@/lib/cockpit/types-credit";

const GRID = "#1e1e2e";
const AXIS = "#8b8b99";
const ACCENT = "#a78bfa";
const TOOLTIP = { background: "#111118", border: "1px solid #1e1e2e", color: "#e5e5ef" };
const PIE = ["#a78bfa", "#22c55e", "#ef4444", "#eab308"];

export function CreditView() {
  const { tenantFilter, locale, currency } = useCockpit();
  const [dash, setDash] = useState<Awaited<ReturnType<typeof fetchCreditDashboard>> | null>(null);
  const [filters, setFilters] = useState<CreditRequestFilters>({ scope: "network", page: 1, page_size: 10 });
  const [rows, setRows] = useState<CreditRequestRow[]>([]);
  const [aml, setAml] = useState<Awaited<ReturnType<typeof fetchCreditAml>> | null>(null);
  const [dealers, setDealers] = useState<Awaited<ReturnType<typeof fetchDealerRanking>> | null>(null);
  const [audit, setAudit] = useState<Awaited<ReturnType<typeof fetchCreditAudit>> | null>(null);

  const money = useMemo(
    () => (n: number) => new Intl.NumberFormat(locale, { style: "currency", currency }).format(n),
    [locale, currency],
  );

  const load = useCallback(async () => {
    const f: CreditRequestFilters = {
      ...filters,
      scope: tenantFilter ? "tenant" : "network",
      tenant_id: tenantFilter ?? undefined,
    };
    const [d, q, a, dr, au] = await Promise.all([
      fetchCreditDashboard(),
      fetchCreditRequests(f),
      fetchCreditAml("today"),
      fetchDealerRanking(5),
      fetchCreditAudit(10),
    ]);
    setDash(d);
    setRows(q.data.items ?? []);
    setAml(a);
    setDealers(dr);
    setAudit(au);
  }, [filters, tenantFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const exportHref = tenantFilter ? resolveCreditHubFetchUrl("/api/v2/credit/bank/export/queue.xlsx") : null;

  return (
    <div className="space-y-6" data-testid="cockpit-credit-view">
      <header>
        <Link href="/cockpit" className="text-sm text-cockpit-accent">
          ← Volver a la Vista de Red
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <span className="rounded bg-cockpit-accent/20 px-2 py-1 text-xs font-bold text-cockpit-accent">CR</span>
          <h1 className="text-[28px] font-semibold">Credit Hub</h1>
          <span className="rounded bg-cockpit-ok/20 px-2 py-0.5 text-xs text-cockpit-ok">Operando</span>
          {dash?.isDemo ? <DataTruthBadge level="DEMO" /> : null}
        </div>
      </header>

      <CockpitErrorBoundary title="KPIs">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-9">
          {(dash?.data.kpis ?? []).map((k) => (
            <div key={k.key} className="rounded-xl border border-cockpit-border bg-cockpit-surface p-3">
              <p className="text-[11px] uppercase text-cockpit-muted">{k.label}</p>
              <p className="font-cockpitMono text-[28px] tabular-nums">
                {k.unit === "DOP" || k.key.includes("amount") ? money(Number(k.value)) : `${k.value ?? "—"}${k.unit === "%" ? "%" : ""}`}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <ChartBox title="Tendencia semanal">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={dash?.data.weekly_trend ?? []}>
                <CartesianGrid stroke={GRID} />
                <XAxis dataKey="week" stroke={AXIS} tick={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 11 }} />
                <YAxis stroke={AXIS} tick={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 11 }} />
                <Tooltip contentStyle={TOOLTIP} />
                <Line type="monotone" dataKey="count" stroke={ACCENT} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartBox>
          <ChartBox title="Por estado">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={dash?.data.status_distribution ?? []} dataKey="count" nameKey="state" innerRadius={40} outerRadius={70}>
                  {(dash?.data.status_distribution ?? []).map((_, i) => (
                    <Cell key={i} fill={PIE[i % PIE.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP} />
              </PieChart>
            </ResponsiveContainer>
          </ChartBox>
          <ChartBox title="Monto mensual">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={dash?.data.monthly_amounts ?? []}>
                <CartesianGrid stroke={GRID} />
                <XAxis dataKey="month" stroke={AXIS} tick={{ fontSize: 11 }} />
                <YAxis stroke={AXIS} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={TOOLTIP} formatter={(v: number) => money(v)} />
                <Bar dataKey="amount" fill={ACCENT} />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </div>
      </CockpitErrorBoundary>

      <CockpitErrorBoundary title="Cola">
        <Panel title="Cola global">
          <div className="mb-3 flex flex-wrap gap-2">
            <input className="cockpit-input" placeholder="Estado" onChange={(e) => setFilters((p) => ({ ...p, state: e.target.value || undefined, page: 1 }))} />
            <input className="cockpit-input" placeholder="Dealer" onChange={(e) => setFilters((p) => ({ ...p, dealer_id: e.target.value || undefined, page: 1 }))} />
            {exportHref ? (
              <a href={exportHref} className="rounded border border-cockpit-border px-3 py-1 text-sm" download>
                Exportar Excel
              </a>
            ) : (
              <span className="text-xs text-cockpit-muted">Excel requiere tenant específico</span>
            )}
          </div>
          <p className="mb-2 text-xs text-cockpit-muted" data-testid="cockpit-query-debug">
            {buildRequestsQuery({ ...filters, scope: tenantFilter ? "tenant" : "network", tenant_id: tenantFilter ?? undefined })}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-cockpit-muted">
                <tr>
                  {["Tenant", "Solicitud", "Dealer", "Cliente", "Monto", "Estado", "Fecha"].map((h) => (
                    <th key={h} className="px-2 py-2">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.application_id} className="border-t border-cockpit-border">
                    <td className="px-2 py-2">{r.tenant_name ?? "—"}</td>
                    <td className="px-2 py-2 font-mono text-xs">{r.application_id}</td>
                    <td className="px-2 py-2">{r.dealer_name ?? "—"}</td>
                    <td className="px-2 py-2">{r.applicant_name ?? "—"}</td>
                    <td className="px-2 py-2">{r.requested_amount != null ? money(r.requested_amount) : "—"}</td>
                    <td className="px-2 py-2">{r.state ?? "—"}</td>
                    <td className="px-2 py-2 text-xs">{r.created_at ? new Date(r.created_at).toLocaleDateString(locale) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </CockpitErrorBoundary>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="AML hoy">
          {aml?.isDemo ? <DataTruthBadge level="DEMO" /> : null}
          <p className="font-cockpitMono text-2xl tabular-nums">{aml?.data.matches_today ?? 0} matches</p>
          <p className="text-sm text-cockpit-muted">{aml?.data.screenings_today ?? 0} screenings</p>
        </Panel>
        <Panel title="Top dealers">
          <ol className="text-sm space-y-1">
            {(dealers?.data.dealers ?? []).map((d, i) => (
              <li key={d.dealer_name}>
                {i + 1}. {d.dealer_name} — {d.volume}
              </li>
            ))}
          </ol>
        </Panel>
        <Panel title="Audit trail">
          <ul className="max-h-40 overflow-y-auto text-xs space-y-1 font-cockpitMono">
            {(audit?.data.events ?? []).map((e) => (
              <li key={e.id}>
                {e.action} · {new Date(e.at).toLocaleString("es-DO")}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-cockpit-border bg-cockpit-surface p-4">
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function ChartBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-cockpit-border bg-cockpit-surface p-3">
      <p className="mb-2 text-xs text-cockpit-muted">{title}</p>
      {children}
    </div>
  );
}

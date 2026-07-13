"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import { fetchTenantsFinancialsPage } from "@/lib/cockpit/api/financeRevenue";
import { formatCurrency } from "@/lib/cockpit/format";
import { normalizeStatus } from "@/lib/cockpit/normalize";
import type { TenantFinancialRow } from "@/lib/cockpit/types-finance";

const PAGE_SIZE = 20;

export function TenantsFinancialsTable({ locale, currency }: { locale: string; currency: string }) {
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<TenantFinancialRow[]>([]);
  const [total, setTotal] = useState(0);
  const [isDemo, setIsDemo] = useState(false);

  const load = useCallback(async () => {
    const r = await fetchTenantsFinancialsPage(page, PAGE_SIZE);
    setRows(r.data.items);
    setTotal(r.data.total);
    setIsDemo(r.isDemo);
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  const money = (n: number) => formatCurrency(n, locale, currency);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section className="rounded-xl border border-cockpit-border bg-cockpit-surface p-4">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-sm font-semibold">Economía por tenant</h2>
        {isDemo ? <DataTruthBadge level="DEMO" /> : null}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-cockpit-muted">
            <tr>
              {["Tenant", "Plan", "MRR", "Estado", "Período", "Renovación"].map((h) => (
                <th key={h} className="px-2 py-2 text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const st = normalizeStatus(r.subscription_status);
              const dot =
                st === "active" ? "bg-cockpit-ok" : st === "suspended" ? "bg-cockpit-warn" : "bg-cockpit-muted";
              return (
                <tr key={r.tenant_id} className="border-t border-cockpit-border">
                  <td className="px-2 py-2">{r.tenant_name}</td>
                  <td className="px-2 py-2">
                    <span className="rounded bg-cockpit-accent/15 px-2 py-0.5 text-xs">{r.plan_name ?? "—"}</span>
                  </td>
                  <td className="px-2 py-2 font-cockpitMono tabular-nums">{money(r.mrr_contribution)}</td>
                  <td className="px-2 py-2 capitalize">
                    <span className={`mr-1 inline-block h-2 w-2 rounded-full ${dot}`} />
                    {st}
                  </td>
                  <td className="px-2 py-2 text-xs">
                    {r.current_period_end ? new Date(r.current_period_end).toLocaleDateString(locale) : "—"}
                  </td>
                  <td className="px-2 py-2 text-xs">
                    {r.next_renewal_at ? new Date(r.next_renewal_at).toLocaleDateString(locale) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center justify-end gap-2 text-xs text-cockpit-muted">
        <button
          type="button"
          className="rounded border border-cockpit-border px-2 py-1 disabled:opacity-40"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Anterior
        </button>
        <span className="font-cockpitMono tabular-nums">
          {page}/{pages}
        </span>
        <button
          type="button"
          className="rounded border border-cockpit-border px-2 py-1 disabled:opacity-40"
          disabled={page >= pages}
          onClick={() => setPage((p) => p + 1)}
        >
          Siguiente
        </button>
      </div>
    </section>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { buildRequestsQuery, fetchCreditRequests } from "../api/creditHub";
import { useCockpit } from "../context";
import { resolveCreditHubFetchUrl } from "@/lib/credit-hub/api/client";
import { DemoPanelBadge } from "../components/DemoPanelBadge";
import { CockpitErrorBoundary } from "../components/ErrorBoundary";
import { PanelError, PanelFrame, PanelSkeleton } from "../components/PanelFrame";
import type { CreditRequestFilters, CreditRequestRow } from "../types-credit";

export function CreditQueuePanel() {
  const { tenantFilter, locale, currency } = useCockpit();
  const [filters, setFilters] = useState<CreditRequestFilters>({ scope: "network", page: 1, page_size: 10 });
  const [rows, setRows] = useState<CreditRequestRow[]>([]);
  const [total, setTotal] = useState(0);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const f: CreditRequestFilters = {
      ...filters,
      scope: tenantFilter ? "tenant" : "network",
      tenant_id: tenantFilter ?? undefined,
    };
    try {
      const res = await fetchCreditRequests(f);
      setRows(res.data.items ?? []);
      setTotal(res.data.total ?? res.data.items?.length ?? 0);
      setIsDemo(res.isDemo);
      if (res.error) setError(res.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filters, tenantFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const exportHref =
    tenantFilter != null
      ? resolveCreditHubFetchUrl("/api/v2/credit/bank/export/queue.xlsx")
      : null;

  return (
    <CockpitErrorBoundary title="Cola global">
      <PanelFrame
        title="Cola de solicitudes"
        badge={isDemo ? <DemoPanelBadge /> : undefined}
        testId="cockpit-credit-queue"
      >
        <div className="mb-3 flex flex-wrap gap-2 text-sm">
          <input
            className="ch-input"
            placeholder="Estado"
            value={filters.state ?? ""}
            onChange={(e) => setFilters((p) => ({ ...p, state: e.target.value || undefined, page: 1 }))}
          />
          <input
            className="ch-input"
            placeholder="Dealer ID"
            value={filters.dealer_id ?? ""}
            onChange={(e) => setFilters((p) => ({ ...p, dealer_id: e.target.value || undefined, page: 1 }))}
          />
          <input type="date" className="ch-input" onChange={(e) => setFilters((p) => ({ ...p, date_from: e.target.value || undefined, page: 1 }))} />
          <input type="date" className="ch-input" onChange={(e) => setFilters((p) => ({ ...p, date_to: e.target.value || undefined, page: 1 }))} />
          {exportHref ? (
            <a href={exportHref} className="ch-btn ch-btn-secondary ch-btn-sm" download>
              Exportar Excel
            </a>
          ) : null}
        </div>
        <p className="mb-2 text-xs text-[var(--ch-text-3)]" data-testid="cockpit-query-debug">
          Query: {buildRequestsQuery({ ...filters, scope: tenantFilter ? "tenant" : "network", tenant_id: tenantFilter ?? undefined })}
        </p>
        {loading ? <PanelSkeleton rows={5} /> : null}
        {!loading && error && rows.length === 0 ? <PanelError message={error} onRetry={load} /> : null}
        {!loading && rows.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--ch-line)] text-xs text-[var(--ch-text-3)]">
                    {["ID", "Tenant", "Dealer", "Solicitante", "Estado", "Monto", "Fecha"].map((h) => (
                      <th key={h} className="px-2 py-2 font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.application_id} className="border-b border-[var(--ch-line)]">
                      <td className="px-2 py-2 font-mono text-xs">{r.application_id}</td>
                      <td className="px-2 py-2">{r.tenant_name ?? "—"}</td>
                      <td className="px-2 py-2">{r.dealer_name ?? "—"}</td>
                      <td className="px-2 py-2">{r.applicant_name ?? "—"}</td>
                      <td className="px-2 py-2">{r.state ?? "—"}</td>
                      <td className="px-2 py-2">
                        {r.requested_amount != null
                          ? new Intl.NumberFormat(locale, { style: "currency", currency }).format(r.requested_amount)
                          : "—"}
                      </td>
                      <td className="px-2 py-2 text-xs">{r.created_at ? new Date(r.created_at).toLocaleDateString(locale) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <button type="button" className="ch-btn ch-btn-secondary ch-btn-sm" disabled={(filters.page ?? 1) <= 1} onClick={() => setFilters((p) => ({ ...p, page: Math.max(1, (p.page ?? 1) - 1) }))}>
                Anterior
              </button>
              <span>
                Pág. {filters.page ?? 1} · {total} total
              </span>
              <button type="button" className="ch-btn ch-btn-secondary ch-btn-sm" onClick={() => setFilters((p) => ({ ...p, page: (p.page ?? 1) + 1 }))}>
                Siguiente
              </button>
            </div>
          </>
        ) : null}
      </PanelFrame>
    </CockpitErrorBoundary>
  );
}

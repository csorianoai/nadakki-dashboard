"use client";

import { type CreditApplicationRow, getApplication, listApplications } from "@/lib/credit-api";
import { formatDOP } from "@/lib/credit-format";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DemoModeLauncher } from "@/components/credit/commercial/DemoModeLauncher";
import { ValidationBanner } from "@/components/credit/ValidationBanner";
import UsageDashboard from "@/components/usage/UsageDashboard";
import { useTenant } from "@/contexts/TenantContext";
import {
  ApplicationStatusBadge,
  CreditHeroShell,
  CreditMetricCard,
  DealerCommandHero,
  PremiumEmptyState,
} from "@/components/credit/forge";
import { ClipboardList, Filter, Layers, Sparkles } from "lucide-react";

interface EnrichedRow extends CreditApplicationRow {
  loanHint?: number | null;
}

const TERMINAL = new Set(["COMPLETED", "DECLINED", "CANCELLED", "REJECTED", "CLOSED"]);

export function DealerListClient() {
  const { tenantId: ctxTenantId } = useTenant();
  const tenantId = (ctxTenantId ?? "").trim();
  const [rows, setRows] = useState<EnrichedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [stateFilter, setStateFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [amountMin, setAmountMin] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listApplications(tenantId, { limit: 100, offset: 0 });
      const apps = res.applications ?? [];
      let enriched: EnrichedRow[] = apps.map((a) => ({ ...a }));
      if (apps.length > 0 && apps.length <= 60) {
        const details = await Promise.all(
          apps.map(async (a) => {
            const id = a.application_id;
            if (!id) return null;
            try {
              const g = await getApplication(tenantId, id);
              const pl = g.application_payload as Record<string, unknown> | undefined;
              const ad = pl?.applicant_data as Record<string, unknown> | undefined;
              const vd = pl?.vehicle_data as Record<string, unknown> | undefined;
              const loan =
                (vd?.loan_amount_requested as number | undefined) ??
                (ad?.loan_amount as number | undefined) ??
                null;
              return { id, loan };
            } catch {
              return { id, loan: null };
            }
          })
        );
        const byId = new Map(details.filter(Boolean).map((d) => [d!.id, d!.loan]));
        enriched = enriched.map((r) => ({
          ...r,
          loanHint: r.application_id ? byId.get(r.application_id) ?? null : null,
        }));
      }
      setRows(enriched);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    let out = rows;
    if (stateFilter) {
      out = out.filter((r) => (r.state ?? "") === stateFilter);
    }
    if (dateFrom) {
      out = out.filter((r) => (r.created_at ?? "") >= dateFrom);
    }
    if (dateTo) {
      out = out.filter((r) => (r.created_at ?? "").slice(0, 10) <= dateTo);
    }
    const amin = amountMin === "" ? null : Number(amountMin);
    if (amin != null && !Number.isNaN(amin)) {
      out = out.filter((r) => (r.loanHint ?? 0) >= amin);
    }
    return out;
  }, [rows, stateFilter, dateFrom, dateTo, amountMin]);

  const states = useMemo(() => {
    const s = new Set<string>();
    rows.forEach((r) => {
      if (r.state) s.add(r.state);
    });
    return [...s].sort();
  }, [rows]);

  const totalApplications = loading ? null : rows.length;
  const activePipelineCount = useMemo(() => {
    if (loading) return null;
    return rows.filter((r) => {
      const st = (r.state ?? "").toUpperCase();
      return st && !TERMINAL.has(st);
    }).length;
  }, [rows, loading]);

  const distinctStates = states.length;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <CreditHeroShell variant="dealer-sunset">
        <DealerCommandHero
          totalApplications={totalApplications}
          activePipelineCount={activePipelineCount}
          newHref="/credit/dealer/new"
          listHref="#pipeline"
        />
      </CreditHeroShell>

      <div id="pipeline" className="scroll-mt-24 space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-100">Pipeline & filtros</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Expedientes reales del tenant seleccionado. Los KPI reflejan el conjunto cargado (hasta 100).
            </p>
          </div>
          <Link
            href="/credit/dealer/new"
            className="inline-flex items-center justify-center rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/25 transition hover:bg-violet-500"
          >
            Nueva solicitud
          </Link>
        </div>

        <UsageDashboard variant="dark" />

        <ValidationBanner error={error} />

        {!loading && rows.length === 0 && !error ? (
          <PremiumEmptyState
            icon={Sparkles}
            title="Aún no hay expedientes"
            description="Cuando existan solicitudes para este tenant, aparecerán aquí con estado, modo y monto de referencia. Todo proviene del Credit Core en vivo."
            ctaLabel="Crear primera solicitud"
            ctaHref="/credit/dealer/new"
          />
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <CreditMetricCard
            label="Expedientes (tenant)"
            value={loading ? "—" : rows.length}
            hint="Total devuelto por el API en esta vista."
            icon={Layers}
          />
          <CreditMetricCard
            label="En flujo activo"
            value={loading ? "—" : (activePipelineCount ?? "—")}
            hint="Excluye estados terminales conocidos (completado / declinado / cancelado)."
            icon={ClipboardList}
          />
          <CreditMetricCard
            label="Tras filtros"
            value={loading ? "—" : filtered.length}
            hint="Coinciden con estado, fechas y monto mínimo."
            icon={Filter}
          />
          <CreditMetricCard
            label="Estados distintos"
            value={loading ? "—" : distinctStates}
            hint="Variedad de máquina de estados observada en datos reales."
            icon={Layers}
          />
        </div>

        <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Estado</label>
            <select
              className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/40"
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
            >
              <option value="">Todos</option>
              {states.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Desde</label>
            <input
              type="date"
              className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/40"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Hasta</label>
            <input
              type="date"
              className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/40"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Monto mín. (RD$)
            </label>
            <input
              type="number"
              min={0}
              className="w-32 rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/40 disabled:opacity-40"
              value={amountMin}
              onChange={(e) => setAmountMin(e.target.value)}
              placeholder={rows.length > 60 ? "N/A >60" : ""}
              disabled={rows.length > 60}
              title={
                rows.length > 60 ? "Filtro por monto disponible con hasta 60 expedientes cargados" : undefined
              }
            />
          </div>
          <button
            type="button"
            onClick={load}
            className="ml-auto rounded-xl border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/5"
          >
            Actualizar
          </button>
        </div>

        <DemoModeLauncher />

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-40 animate-pulse rounded-2xl bg-white/5" />
            <div className="h-40 animate-pulse rounded-2xl bg-white/5" />
          </div>
        ) : rows.length > 0 && filtered.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-200">Ningún expediente coincide con los filtros</p>
            <p className="mt-2 text-xs text-slate-500">Ajuste fechas, estado o monto mínimo, o pulse Actualizar.</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((r) => (
              <article
                key={r.application_id}
                className="group flex flex-col rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-5 shadow-lg shadow-black/20 transition hover:border-violet-500/35 hover:shadow-violet-900/10"
              >
                <div className="flex items-start justify-between gap-3">
                  <ApplicationStatusBadge state={r.state} />
                  <span className="text-[10px] font-mono text-slate-500">{r.application_id?.slice(0, 8)}…</span>
                </div>
                <p className="mt-3 font-mono text-xs leading-relaxed text-slate-400 break-all">{r.application_id}</p>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Modo</dt>
                    <dd className="text-right text-slate-200">{r.mode ?? "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Monto ref.</dt>
                    <dd className="text-right font-medium tabular-nums text-slate-100">
                      {r.loanHint != null ? formatDOP(r.loanHint) : "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Creado</dt>
                    <dd className="text-right text-xs text-slate-400">{r.created_at ?? "—"}</dd>
                  </div>
                </dl>
                <div className="mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-4">
                  <Link
                    href={`/credit/dealer/${encodeURIComponent(r.application_id ?? "")}`}
                    className="inline-flex flex-1 items-center justify-center rounded-xl bg-violet-600/90 px-3 py-2 text-center text-xs font-semibold text-white transition hover:bg-violet-500"
                  >
                    Abrir expediente
                  </Link>
                  <Link
                    href={`/credit/status/${encodeURIComponent(r.application_id ?? "")}`}
                    className="inline-flex items-center justify-center rounded-xl border border-white/15 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/5"
                  >
                    Estado cliente
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        {rows.length > 0 && filtered.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <p className="border-b border-white/10 bg-white/[0.03] px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Vista tabla (compacta)
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Modo</th>
                    <th className="px-4 py-3">Monto ref.</th>
                    <th className="px-4 py-3">Creado</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={`t-${r.application_id}`} className="border-b border-white/5 hover:bg-white/[0.03]">
                      <td className="px-4 py-3 font-mono text-xs text-slate-300">{r.application_id}</td>
                      <td className="px-4 py-3">
                        <ApplicationStatusBadge state={r.state} />
                      </td>
                      <td className="px-4 py-3 text-slate-400">{r.mode ?? "—"}</td>
                      <td className="px-4 py-3 tabular-nums text-slate-200">
                        {r.loanHint != null ? formatDOP(r.loanHint) : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{r.created_at ?? "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/credit/dealer/${encodeURIComponent(r.application_id ?? "")}`}
                          className="text-xs font-medium text-violet-400 hover:underline"
                        >
                          Abrir
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

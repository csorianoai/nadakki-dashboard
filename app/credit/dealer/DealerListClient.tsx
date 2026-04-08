"use client";

import { type CreditApplicationRow, getApplication, listApplications } from "@/lib/credit-api";
import { formatDOP } from "@/lib/credit-format";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ValidationBanner } from "@/components/credit/ValidationBanner";

interface EnrichedRow extends CreditApplicationRow {
  loanHint?: number | null;
}

export function DealerListClient({ tenantId }: { tenantId: string }) {
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
              const pl = g.application_payload as
                | Record<string, unknown>
                | undefined;
              const ad = pl?.applicant_data as
                | Record<string, unknown>
                | undefined;
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

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-50">
            Portal Dealer — Crédito
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Expedientes reales del tenant seleccionado
          </p>
        </div>
        <Link
          href="/credit/dealer/new"
          className="inline-flex justify-center rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
        >
          Nueva solicitud
        </Link>
      </div>

      <ValidationBanner error={error} />

      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-[10px] uppercase text-slate-500 mb-1">
            Estado
          </label>
          <select
            className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-slate-100"
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
          <label className="block text-[10px] uppercase text-slate-500 mb-1">
            Desde
          </label>
          <input
            type="date"
            className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-slate-100"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase text-slate-500 mb-1">
            Hasta
          </label>
          <input
            type="date"
            className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-slate-100"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase text-slate-500 mb-1">
            Monto mín. (RD$)
          </label>
          <input
            type="number"
            min={0}
            className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-slate-100 w-32"
            value={amountMin}
            onChange={(e) => setAmountMin(e.target.value)}
            placeholder={rows.length > 60 ? "N/A >60" : ""}
            disabled={rows.length > 60}
            title={
              rows.length > 60
                ? "Filtro por monto disponible con hasta 60 expedientes cargados"
                : undefined
            }
          />
        </div>
        <button
          type="button"
          onClick={load}
          className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-slate-300 hover:bg-white/5"
        >
          Actualizar
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse h-64 rounded-xl bg-white/5" />
      ) : (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-left text-xs text-slate-500 uppercase">
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Modo</th>
                <th className="px-3 py-2">Monto ref.</th>
                <th className="px-3 py-2">Creado</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-10 text-center text-slate-500"
                  >
                    No hay solicitudes con los filtros actuales
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr
                    key={r.application_id}
                    className="border-b border-white/5 hover:bg-white/[0.03]"
                  >
                    <td className="px-3 py-2 font-mono text-xs text-slate-300">
                      {r.application_id}
                    </td>
                    <td className="px-3 py-2">{r.state}</td>
                    <td className="px-3 py-2 text-slate-400">{r.mode ?? "—"}</td>
                    <td className="px-3 py-2 tabular-nums">
                      {r.loanHint != null ? formatDOP(r.loanHint) : "—"}
                    </td>
                    <td className="px-3 py-2 text-slate-500 text-xs">
                      {r.created_at ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Link
                        href={`/credit/dealer/${encodeURIComponent(r.application_id ?? "")}`}
                        className="text-violet-400 hover:underline text-xs"
                      >
                        Abrir
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

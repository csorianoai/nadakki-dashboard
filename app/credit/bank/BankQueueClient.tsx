"use client";

import { ValidationBanner } from "@/components/credit";
import {
  type CreditApplicationRow,
  getApplicationFull,
  listApplications,
} from "@/lib/credit-api";
import { useTenant } from "@/contexts/TenantContext";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDOP } from "@/lib/credit-format";

interface Row extends CreditApplicationRow {
  scoreHint?: number | null;
  loanHint?: number | null;
}

export function BankQueueClient() {
  const { tenantId: ctxTenantId } = useTenant();
  const tenantId = (ctxTenantId ?? "").trim();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [stateFilter, setStateFilter] = useState("");
  const [scoreMin, setScoreMin] = useState("");
  const [amountMin, setAmountMin] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listApplications(tenantId, { limit: 100, offset: 0 });
      const apps = res.applications ?? [];
      let enriched: Row[] = apps.map((a) => ({ ...a }));
      if (apps.length > 0 && apps.length <= 50) {
        const details = await Promise.all(
          apps.map(async (a) => {
            const id = a.application_id;
            if (!id) return null;
            try {
              const f = await getApplicationFull(tenantId, id);
              const ai = f.ai_decision as Record<string, unknown> | null;
              const score =
                ai?.score != null ? Number(ai.score as number) : null;
              const v = f.vehicle as Record<string, unknown> | undefined;
              const loan =
                v?.loan_amount_requested != null
                  ? Number(v.loan_amount_requested)
                  : null;
              return { id, score, loan };
            } catch {
              return { id, score: null, loan: null };
            }
          })
        );
        const map = new Map(
          details.filter(Boolean).map((d) => [
            d!.id,
            { score: d!.score, loan: d!.loan },
          ])
        );
        enriched = enriched.map((r) => {
          const x = r.application_id ? map.get(r.application_id) : undefined;
          return {
            ...r,
            scoreHint: x?.score ?? null,
            loanHint: x?.loan ?? null,
          };
        });
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
    const smin = scoreMin === "" ? null : Number(scoreMin);
    if (smin != null && !Number.isNaN(smin)) {
      out = out.filter((r) => (r.scoreHint ?? -1) >= smin);
    }
    const amin = amountMin === "" ? null : Number(amountMin);
    if (amin != null && !Number.isNaN(amin)) {
      out = out.filter((r) => (r.loanHint ?? 0) >= amin);
    }
    return out;
  }, [rows, stateFilter, scoreMin, amountMin]);

  const states = useMemo(() => {
    const s = new Set<string>();
    rows.forEach((r) => {
      if (r.state) s.add(r.state);
    });
    return [...s].sort();
  }, [rows]);

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-slate-50">
          Portal Banco — Cola de solicitudes
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Datos en vivo; puntaje requiere expediente procesado
        </p>
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
            Score mín.
          </label>
          <input
            type="number"
            className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-slate-100 w-28"
            value={scoreMin}
            onChange={(e) => setScoreMin(e.target.value)}
            disabled={rows.length > 50}
            title={
              rows.length > 50
                ? "Filtro por score con hasta 50 solicitudes en cola"
                : undefined
            }
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase text-slate-500 mb-1">
            Monto mín.
          </label>
          <input
            type="number"
            className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-slate-100 w-28"
            value={amountMin}
            onChange={(e) => setAmountMin(e.target.value)}
            disabled={rows.length > 50}
          />
        </div>
        <button
          type="button"
          onClick={load}
          className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-slate-300"
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
                <th className="px-3 py-2">Score</th>
                <th className="px-3 py-2">Monto</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-10 text-center text-slate-500">
                    Sin solicitudes que coincidan
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
                    <td className="px-3 py-2 tabular-nums">
                      {r.scoreHint != null ? r.scoreHint.toFixed(1) : "—"}
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {r.loanHint != null ? formatDOP(r.loanHint) : "—"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Link
                        href={`/credit/bank/${encodeURIComponent(r.application_id ?? "")}`}
                        className="text-emerald-400 hover:underline text-xs"
                      >
                        Expediente
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

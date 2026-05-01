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
import {
  ApplicationStatusBadge,
  BankUnderwritingHero,
  CreditMetricCard,
  PremiumEmptyState,
} from "@/components/credit/forge";
import { Building2, ClipboardList, Gauge, ShieldCheck } from "lucide-react";

interface Row extends CreditApplicationRow {
  scoreHint?: number | null;
  loanHint?: number | null;
}

const TERMINAL = new Set(["COMPLETED", "DECLINED", "CANCELLED", "REJECTED", "CLOSED"]);

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
              const score = ai?.score != null ? Number(ai.score as number) : null;
              const v = f.vehicle as Record<string, unknown> | undefined;
              const loan =
                v?.loan_amount_requested != null ? Number(v.loan_amount_requested) : null;
              return { id, score, loan };
            } catch {
              return { id, score: null, loan: null };
            }
          })
        );
        const map = new Map(
          details.filter(Boolean).map((d) => [d!.id, { score: d!.score, loan: d!.loan }])
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

  const completedCount = useMemo(
    () => rows.filter((r) => (r.state ?? "").toUpperCase() === "COMPLETED").length,
    [rows]
  );

  const openPipeline = useMemo(
    () =>
      rows.filter((r) => {
        const st = (r.state ?? "").toUpperCase();
        return st && !TERMINAL.has(st);
      }).length,
    [rows]
  );

  const scoredRows = useMemo(() => rows.filter((r) => r.scoreHint != null), [rows]);
  const avgScore =
    scoredRows.length > 0
      ? scoredRows.reduce((a, r) => a + (r.scoreHint ?? 0), 0) / scoredRows.length
      : null;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <BankUnderwritingHero />

      <ValidationBanner error={error} />

      {!loading && rows.length === 0 && !error ? (
        <PremiumEmptyState
          icon={Building2}
          title="Sin solicitudes en cola"
          description="Cuando existan expedientes para este tenant, podrá filtrarlos y abrir el dossier de decisión. Los datos provienen del API en vivo."
          ctaLabel="Volver a dealer"
          ctaHref="/credit/dealer"
          secondaryLabel="Actualizar"
          secondaryHref="#"
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CreditMetricCard
          label="En cola (tenant)"
          value={loading ? "—" : rows.length}
          hint="Listado devuelto por el API (hasta 100)."
          icon={ClipboardList}
        />
        <CreditMetricCard
          label="Pipeline abierto"
          value={loading ? "—" : openPipeline}
          hint="No terminal: requiere acción o seguimiento."
          icon={Gauge}
        />
        <CreditMetricCard
          label="Completadas"
          value={loading ? "—" : completedCount}
          hint="Estado COMPLETED observado en datos."
          icon={ShieldCheck}
        />
        <CreditMetricCard
          label="Score IA medio"
          value={loading ? "—" : avgScore == null ? "—" : avgScore.toFixed(1)}
          hint={scoredRows.length === 0 ? "Sin scores hasta procesar expedientes." : `Basado en ${scoredRows.length} expediente(s) con score.`}
          icon={Gauge}
        />
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Estado</label>
          <select
            className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500/40 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
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
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Score mín.</label>
          <input
            type="number"
            className="w-28 rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500/40 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 disabled:opacity-40"
            value={scoreMin}
            onChange={(e) => setScoreMin(e.target.value)}
            disabled={rows.length > 50}
            title={rows.length > 50 ? "Filtro por score con hasta 50 solicitudes en cola" : undefined}
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Monto mín.</label>
          <input
            type="number"
            className="w-28 rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500/40 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 disabled:opacity-40"
            value={amountMin}
            onChange={(e) => setAmountMin(e.target.value)}
            disabled={rows.length > 50}
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

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-44 animate-pulse rounded-2xl bg-white/5" />
          <div className="h-44 animate-pulse rounded-2xl bg-white/5" />
        </div>
      ) : rows.length > 0 && filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-12 text-center">
          <p className="text-sm font-medium text-slate-200">Nada coincide con los filtros</p>
          <p className="mt-2 text-xs text-slate-500">Ajuste score, monto o estado.</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => (
            <article
              key={r.application_id}
              className="flex flex-col rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent p-5 shadow-xl transition hover:border-emerald-500/30 hover:shadow-emerald-900/10"
            >
              <div className="flex items-start justify-between gap-2">
                <ApplicationStatusBadge state={r.state} />
                <span className="font-mono text-[10px] text-slate-500">{r.application_id?.slice(0, 8)}…</span>
              </div>
              <p className="mt-3 font-mono text-xs text-slate-400 break-all">{r.application_id}</p>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Score IA</dt>
                  <dd className="font-mono font-semibold tabular-nums text-emerald-200">
                    {r.scoreHint != null ? r.scoreHint.toFixed(1) : "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Monto</dt>
                  <dd className="text-right font-medium tabular-nums text-slate-100">
                    {r.loanHint != null ? formatDOP(r.loanHint) : "—"}
                  </dd>
                </div>
              </dl>
              <Link
                href={`/credit/bank/${encodeURIComponent(r.application_id ?? "")}`}
                className="mt-5 inline-flex flex-1 items-center justify-center rounded-xl bg-emerald-600 px-3 py-2.5 text-center text-xs font-semibold text-white transition hover:bg-emerald-500"
              >
                Abrir dossier
              </Link>
            </article>
          ))}
        </div>
      ) : null}

      {rows.length > 0 && filtered.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <p className="border-b border-white/10 bg-white/[0.03] px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Vista tabla
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Monto</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={`b-${r.application_id}`} className="border-b border-white/5 hover:bg-white/[0.03]">
                    <td className="px-4 py-3 font-mono text-xs text-slate-300">{r.application_id}</td>
                    <td className="px-4 py-3">
                      <ApplicationStatusBadge state={r.state} />
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-200">
                      {r.scoreHint != null ? r.scoreHint.toFixed(1) : "—"}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-200">
                      {r.loanHint != null ? formatDOP(r.loanHint) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/credit/bank/${encodeURIComponent(r.application_id ?? "")}`}
                        className="text-xs font-medium text-emerald-400 hover:underline"
                      >
                        Expediente
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
  );
}

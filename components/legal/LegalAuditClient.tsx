"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLegalAuditTrail, useLegalEffectiveTenantId } from "@/hooks/useLegal";
import type { AuditTrailEntry } from "@/types/legal";
import { exportLegalAuditCsv } from "@/lib/legal/csv";
import { trackEvent } from "@/lib/legal/telemetry";
import { LegalErrorState } from "@/components/legal/LegalErrorState";
import { LegalLoadingSkeleton } from "@/components/legal/LegalLoadingSkeleton";
import { LegalEmptyState } from "@/components/legal/LegalEmptyState";
import { AuditRiskBadge } from "@/components/legal/AuditRiskBadge";
import { PracticeAreaChipGroup } from "@/components/legal/PracticeAreaChipGroup";
import { PracticeAreaFilter } from "@/components/legal/PracticeAreaFilter";
import { AuditChainIntegrityPanel } from "@/components/legal/audit/AuditChainIntegrityPanel";
import { useLegalCases } from "@/hooks/legal/useLegalCases";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";
import { auditTrailRiskLabel, auditTrailStatusLabel } from "@/lib/legal/presentation-labels";

function latencyClass(ms: number | undefined) {
  if (ms == null) return "text-slate-500";
  if (ms < 2000) return "text-emerald-600 dark:text-emerald-400";
  if (ms < 5000) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function filterEntries(
  entries: AuditTrailEntry[],
  opts: {
    agent?: string;
    status?: string;
    risk?: string;
    from?: string;
    to?: string;
    requestId?: string;
    practiceAreas?: string[];
  }
): AuditTrailEntry[] {
  return entries.filter((e) => {
    if (opts.agent && opts.agent !== "all" && e.agent_id !== opts.agent) return false;
    if (opts.status && e.status !== opts.status) return false;
    if (opts.risk && (e.monitor?.riesgo_evaluado || "") !== opts.risk) return false;
    if (opts.requestId && !e.request_id.toLowerCase().includes(opts.requestId.toLowerCase())) return false;
    if (opts.practiceAreas && opts.practiceAreas.length > 0) {
      const tags = e.practice_area_tags ?? [];
      if (tags.length === 0) return false;
      if (!tags.some((t) => opts.practiceAreas!.includes(t))) return false;
    }
    const t = new Date(e.timestamp).getTime();
    if (opts.from) {
      const f = new Date(opts.from).getTime();
      if (t < f) return false;
    }
    if (opts.to) {
      const x = new Date(opts.to).getTime();
      if (t > x + 86400000) return false;
    }
    return true;
  });
}

export default function LegalAuditClient() {
  const m = useLegalCasesMessages();
  const searchParams = useSearchParams();
  const { effectiveTenantId, tenantHydrated, tenantError } = useLegalEffectiveTenantId();
  const [limit, setLimit] = useState(50);
  const { entries, loading, error, refetch } = useLegalAuditTrail(effectiveTenantId, undefined, limit);
  const [agent, setAgent] = useState("all");
  const [status, setStatus] = useState("");
  const [risk, setRisk] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [reqSearch, setReqSearch] = useState("");
  const [practiceAreaFilter, setPracticeAreaFilter] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [chainCaseId, setChainCaseId] = useState("");
  const pageSize = 20;
  const casesQ = useLegalCases(effectiveTenantId);

  useEffect(() => {
    const cid = searchParams.get("case_id")?.trim();
    if (cid) setChainCaseId(cid);
  }, [searchParams]);

  useEffect(() => {
    if (chainCaseId || !casesQ.data?.cases?.length) return;
    setChainCaseId(casesQ.data.cases[0]!.case_id);
  }, [casesQ.data?.cases, chainCaseId]);

  useEffect(() => {
    const r = searchParams.get("request_id");
    if (r) setReqSearch(r);
  }, [searchParams]);

  useEffect(() => {
    const a = searchParams.get("agent")?.trim();
    if (a) setAgent(a);
  }, [searchParams]);

  useEffect(() => {
    if (effectiveTenantId) {
      trackEvent("legal_page_view", { page: "audit", tenant_id: effectiveTenantId });
    }
  }, [effectiveTenantId]);

  const filtered = useMemo(
    () =>
      filterEntries(entries, {
        agent,
        status: status || undefined,
        risk: risk || undefined,
        from,
        to,
        requestId: reqSearch,
        practiceAreas: practiceAreaFilter.length > 0 ? practiceAreaFilter : undefined,
      }),
    [entries, agent, status, risk, from, to, reqSearch, practiceAreaFilter]
  );

  const metrics = useMemo(() => {
    const n = filtered.length;
    const ok = filtered.filter((e) => e.status === "success").length;
    const latencies = filtered.map((e) => e.latency_total_ms).filter((x): x is number => typeof x === "number");
    const avgLat = latencies.length ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
    const cites = filtered.map((e) => e.output_metadata?.citations_count ?? 0);
    const avgCit = cites.length ? cites.reduce((a, b) => a + b, 0) / cites.length : 0;
    return {
      n,
      successRate: n ? Math.round((ok / n) * 100) : 0,
      avgLat,
      avgCit: Math.round(avgCit * 10) / 10,
    };
  }, [filtered]);

  const pageRows = useMemo(() => {
    const start = page * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  if (!tenantHydrated) {
    return <LegalLoadingSkeleton variant="row" rows={10} />;
  }
  if (tenantError || !effectiveTenantId) {
    return <LegalErrorState message={tenantError || "Tenant no disponible"} />;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 border-b border-slate-200 pb-4 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{m.audit.title}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Trazabilidad para compliance bancario (hashes; sin texto completo de entrada).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs dark:border-slate-700 dark:bg-slate-800">
            {m.audit.iso_badge}
          </span>
          <button
            type="button"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            aria-label="Exportar CSV de auditoría"
            onClick={() => {
              exportLegalAuditCsv(effectiveTenantId, filtered);
              trackEvent("legal_audit_csv_exported", { tenant_id: effectiveTenantId, rows_count: filtered.length });
            }}
          >
            Exportar CSV
          </button>
        </div>
      </header>

      {error && <LegalErrorState message={error} onRetry={() => void refetch()} />}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label={m.audit.metric_queries} value={String(metrics.n)} />
        <Metric label={m.audit.metric_success_rate} value={`${metrics.successRate}%`} />
        <Metric label={m.audit.metric_avg_latency} value={`${Math.round(metrics.avgLat)} ms`} />
        <Metric label={m.audit.metric_avg_citations} value={String(metrics.avgCit)} />
      </section>

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="audit-chain-case">
          Expediente para verificación de cadena
        </label>
        <input
          id="audit-chain-case"
          className="w-full max-w-xl rounded border border-slate-300 bg-white px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-950"
          value={chainCaseId}
          onChange={(e) => setChainCaseId(e.target.value)}
          placeholder="UUID del expediente"
        />
        {chainCaseId.trim() ? (
          <AuditChainIntegrityPanel tenantId={effectiveTenantId} caseId={chainCaseId.trim()} />
        ) : null}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          <select
            className="rounded border border-slate-300 bg-white px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            value={agent}
            onChange={(e) => setAgent(e.target.value)}
            aria-label="Filtro agente"
          >
            <option value="all">{m.audit.filter_all_agents}</option>
            {Array.from(new Set(entries.map((e) => e.agent_id))).map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
          <select
            className="rounded border border-slate-300 bg-white px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filtro estado"
          >
            <option value="">{m.audit.filter_status_all}</option>
            <option value="success">{auditTrailStatusLabel(m, "success")}</option>
            <option value="error">{auditTrailStatusLabel(m, "error")}</option>
            <option value="timeout">{auditTrailStatusLabel(m, "timeout")}</option>
          </select>
          <select
            className="rounded border border-slate-300 bg-white px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            value={risk}
            onChange={(e) => setRisk(e.target.value)}
            aria-label="Filtro riesgo"
          >
            <option value="">{m.audit.filter_risk_all}</option>
            <option value="low">{auditTrailRiskLabel(m, "low")}</option>
            <option value="medium">{auditTrailRiskLabel(m, "medium")}</option>
            <option value="high">{auditTrailRiskLabel(m, "high")}</option>
          </select>
          <input
            type="date"
            className="rounded border border-slate-300 px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            aria-label="Desde fecha"
          />
          <input
            type="date"
            className="rounded border border-slate-300 px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            aria-label="Hasta fecha"
          />
          <select
            className="rounded border border-slate-300 bg-white px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            aria-label="Límite registros"
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                Límite {n}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-3 flex flex-col gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
          <PracticeAreaFilter selected={practiceAreaFilter} onChange={setPracticeAreaFilter} placeholder="Filtrar por área legal" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            type="search"
            placeholder="request_id…"
            className="min-w-[200px] flex-1 rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            value={reqSearch}
            onChange={(e) => setReqSearch(e.target.value)}
            aria-label="Buscar por request id"
          />
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700"
            onClick={() => {
              setAgent("all");
              setStatus("");
              setRisk("");
              setFrom("");
              setTo("");
              setReqSearch("");
              setPracticeAreaFilter([]);
              setPage(0);
            }}
          >
            Limpiar filtros
          </button>
        </div>
      </section>

      {loading ? (
        <LegalLoadingSkeleton variant="row" rows={10} />
      ) : filtered.length === 0 ? (
        <LegalEmptyState
          title="Sin registros"
          description="No hay entradas que coincidan con los filtros o el backend aún no registró actividad."
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
                <tr>
                  <th className="p-3 font-medium">{m.audit.col_timestamp}</th>
                  <th className="p-3 font-medium">{m.audit.col_agent}</th>
                  <th className="p-3 font-medium">{m.audit.col_status}</th>
                  <th className="p-3 font-medium">{m.audit.col_citations}</th>
                  <th className="p-3 font-medium">{m.audit.col_latency}</th>
                  <th className="p-3 font-medium">{m.audit.col_risk}</th>
                  <th className="p-3 font-medium">{m.audit.col_areas}</th>
                  <th className="p-3 font-medium">{m.audit.col_actions}</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((e) => (
                  <Fragment key={e.request_id}>
                    <tr
                      className="cursor-pointer border-b border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-950/80"
                      onClick={() => setExpanded((x) => (x === e.request_id ? null : e.request_id))}
                    >
                      <td className="p-3 text-xs text-slate-600 dark:text-slate-400" title={e.timestamp}>
                        {new Date(e.timestamp).toLocaleString("es-DO")}
                      </td>
                      <td className="p-3 font-mono text-xs">{e.agent_id}</td>
                      <td className="p-3">{e.status || "—"}</td>
                      <td className="p-3">{e.output_metadata?.citations_count ?? "—"}</td>
                      <td className={`p-3 font-mono text-xs ${latencyClass(e.latency_total_ms)}`}>
                        {e.latency_total_ms ?? "—"}ms
                      </td>
                      <td className="p-3">
                        <AuditRiskBadge risk={e.monitor?.riesgo_evaluado} />
                      </td>
                      <td className="p-3 max-w-[180px]">
                        {(e.practice_area_tags?.length ?? 0) > 0 ? (
                          <PracticeAreaChipGroup tags={e.practice_area_tags ?? []} maxVisible={3} size="sm" />
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="p-3">
                        <button
                          type="button"
                          className="text-blue-600 underline dark:text-blue-400"
                          aria-label="Copiar request id"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            void navigator.clipboard.writeText(e.request_id);
                          }}
                        >
                          Copiar ID
                        </button>
                      </td>
                    </tr>
                    {expanded === e.request_id && (
                      <tr className="bg-slate-50 dark:bg-slate-950/50">
                        <td colSpan={8} className="p-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-1 font-mono text-xs">
                              <p>
                                <span className="text-slate-500">request_id:</span> {e.request_id}
                              </p>
                              <p>
                                <span className="text-slate-500">tenant:</span> {e.tenant_id}
                              </p>
                              <p>
                                <span className="text-slate-500">input_hash:</span> {e.input_hash || "—"}
                              </p>
                              <p>
                                <span className="text-slate-500">pack_hash:</span> {e.rag_metadata?.pack_hash || "—"}
                              </p>
                            </div>
                            <div className="text-xs text-slate-700 dark:text-slate-300">
                              <p>LLM: {e.llm_metadata?.provider || "—"} / {e.llm_metadata?.model || "—"}</p>
                              <p>LLM latency: {e.llm_metadata?.latency_ms ?? "—"} ms</p>
                              <p>
                                RAG capa1/2: {e.rag_metadata?.fuentes_capa_1_count ?? "—"} /{" "}
                                {e.rag_metadata?.fuentes_capa_2_count ?? "—"}
                              </p>
                              <p>Alertas: {(e.monitor?.alertas ?? []).join(", ") || "—"}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              className="rounded border border-slate-300 px-3 py-1 disabled:opacity-40 dark:border-slate-700"
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Anterior
            </button>
            <span>
              Página {page + 1} de {totalPages}
            </span>
            <button
              type="button"
              className="rounded border border-slate-300 px-3 py-1 disabled:opacity-40 dark:border-slate-700"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-50">{value}</p>
    </div>
  );
}

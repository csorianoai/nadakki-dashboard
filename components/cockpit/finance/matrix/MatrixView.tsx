"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FinanceSubNav } from "@/components/cockpit/finance/FinanceSubNav";
import { RegistryWarningsBanner } from "@/components/cockpit/finance/registry/RegistryWarningsBanner";
import {
  fetchFinanceMatrix,
  matrixToCsv,
} from "@/lib/cockpit/api/matrix";
import type { FinanceMatrixResponse, MatrixMetric, MatrixPeriod } from "@/lib/cockpit/finance-v3/contracts/matrix";
import { POPULATION_API_CORES } from "@/lib/cockpit/population-config";
import { MatrixTable } from "./MatrixTable";

const METRICS: {
  id: MatrixMetric;
  label: string;
  disabled?: boolean;
  disabledReason?: string;
}[] = [
  { id: "active_users", label: "Usuarios activos" },
  { id: "mrr", label: "MRR aportado" },
  { id: "activity_7d", label: "Actividad 7 días" },
  { id: "core_status", label: "Estado del core" },
  { id: "estimated_cost", label: "Costo estimado", disabled: true, disabledReason: "Requiere metering" },
  { id: "margin", label: "Margen", disabled: true, disabledReason: "Requiere metering" },
];

const PERIODS: { id: MatrixPeriod; label: string }[] = [
  { id: "7d", label: "7d" },
  { id: "30d", label: "30d" },
  { id: "current", label: "Mes actual" },
];

function MatrixContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestCountRef = useRef(0);

  const metric = (searchParams.get("metric") as MatrixMetric) || "active_users";
  const period = (searchParams.get("period") as MatrixPeriod) || "7d";
  const country = searchParams.get("country") || "";
  const planCode = searchParams.get("plan") || "";
  const coreEnabled = searchParams.get("core") || "";

  const [matrix, setMatrix] = useState<FinanceMatrixResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [extraWarnings, setExtraWarnings] = useState<FinanceMatrixResponse["warnings"]>([]);

  const updateParams = useCallback(
    (patch: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === "") params.delete(k);
        else params.set(k, v);
      }
      router.replace(`/cockpit/finance/matrix?${params.toString()}`);
    },
    [router, searchParams],
  );

  const load = useCallback(
    async (cursor?: string | null, append = false) => {
      setLoading(!append);
      setError(null);
      requestCountRef.current += 1;

      const result = await fetchFinanceMatrix({
        metric,
        period,
        row_limit: 50,
        row_cursor: cursor,
        country: country || null,
        plan_code: planCode || null,
        core_enabled: coreEnabled || null,
      });

      if (result.status === "error") {
        setError(result.error);
        if (!append) setMatrix(null);
        setLoading(false);
        return;
      }

      let data = result.data;
      setExtraWarnings(data.warnings ?? []);

      if (append && matrix) {
        data = { ...data, rows: [...matrix.rows, ...data.rows] };
      }
      setMatrix(data);
      setLoading(false);
    },
    [metric, period, country, planCode, coreEnabled, matrix],
  );

  useEffect(() => {
    void load(null, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload on filter change only
  }, [metric, period, country, planCode, coreEnabled]);

  const exportCsv = () => {
    if (!matrix) return;
    const blob = new Blob([matrixToCsv(matrix)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cockpit-matrix-${metric}-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4" data-testid="finance-matrix-view">
      <div className="flex flex-wrap gap-2" data-testid="matrix-metric-nav">
        {METRICS.map((m) => (
          <button
            key={m.id}
            type="button"
            disabled={m.disabled}
            onClick={() => !m.disabled && updateParams({ metric: m.id })}
            className={`rounded-lg px-3 py-1.5 text-xs ${
              m.disabled
                ? "cursor-not-allowed border border-cockpit-border text-cockpit-muted opacity-60"
                : metric === m.id
                  ? "bg-cockpit-accent/15 text-cockpit-text"
                  : "border border-cockpit-border text-cockpit-muted hover:text-cockpit-text"
            }`}
          >
            {m.label}
            {m.disabledReason ? (
              <span className="ml-1 text-[10px] text-cockpit-muted">({m.disabledReason})</span>
            ) : null}
          </button>
        ))}
      </div>

      {metric === "mrr" ? (
        <p className="text-xs text-cockpit-muted">
          MRR atribuible por core — la suma de columnas puede exceder el total global (regla{" "}
          <code className="font-mono">attributable</code>). MRR sin cores asignados aparece en{" "}
          <code className="font-mono">unallocated_mrr</code>.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3" data-testid="matrix-filters">
        <select
          className="rounded-lg border border-cockpit-border bg-cockpit-bg px-3 py-1.5 text-sm"
          value={period}
          onChange={(e) => updateParams({ period: e.target.value })}
        >
          {PERIODS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        <select
          className="rounded-lg border border-cockpit-border bg-cockpit-bg px-3 py-1.5 text-sm"
          value={country}
          onChange={(e) => updateParams({ country: e.target.value || null })}
        >
          <option value="">Todos los países</option>
          <option value="DO">DO</option>
          <option value="US">US</option>
        </select>
        <select
          className="rounded-lg border border-cockpit-border bg-cockpit-bg px-3 py-1.5 text-sm"
          value={planCode}
          onChange={(e) => updateParams({ plan: e.target.value || null })}
        >
          <option value="">Todos los planes</option>
          <option value="enterprise">Enterprise</option>
          <option value="basic">Basic</option>
          <option value="free">Free</option>
        </select>
        <select
          className="rounded-lg border border-cockpit-border bg-cockpit-bg px-3 py-1.5 text-sm"
          value={coreEnabled}
          onChange={(e) => updateParams({ core: e.target.value || null })}
        >
          <option value="">Todos los cores</option>
          {POPULATION_API_CORES.map((c) => (
            <option key={c.apiName} value={c.apiName}>
              {c.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="rounded-lg border border-cockpit-border px-3 py-1.5 text-sm"
          onClick={exportCsv}
          disabled={!matrix?.rows.length}
        >
          Exportar CSV
        </button>
        <span className="self-center text-xs text-cockpit-muted" data-testid="matrix-request-count">
          requests: {requestCountRef.current}
        </span>
      </div>

      <RegistryWarningsBanner warnings={[...(matrix?.warnings ?? []), ...(extraWarnings ?? [])]} />
      {error ? <p className="text-sm text-cockpit-err">{error}</p> : null}
      {loading ? <p className="text-sm text-cockpit-muted">Cargando matriz…</p> : null}
      {matrix ? <MatrixTable matrix={matrix} onRetry={() => void load(null, false)} /> : null}

      {matrix?.has_more ? (
        <button
          type="button"
          className="rounded-lg bg-cockpit-accent px-4 py-2 text-sm"
          onClick={() => void load(matrix.next_cursor, true)}
          data-testid="matrix-load-more"
        >
          Cargar más ({matrix.rows.length} / {matrix.total_rows})
        </button>
      ) : null}
    </div>
  );
}

export function MatrixView() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-cockpit-text">Finanzas</h1>
        <p className="text-sm text-cockpit-muted">Matriz tenants × cores</p>
      </header>
      <FinanceSubNav />
      <Suspense fallback={<p className="text-sm text-cockpit-muted">Cargando…</p>}>
        <MatrixContent />
      </Suspense>
    </div>
  );
}

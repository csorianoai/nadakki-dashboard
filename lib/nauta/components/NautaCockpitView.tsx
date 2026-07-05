"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTenantBranding } from "@/lib/hooks/useTenantBranding";
import { resolveVisiblePlatformTitle } from "@/lib/white-label/brand-display";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";
import { useNautaEmployees } from "@/hooks/nauta/useNautaEmployees";
import { useNautaRuns } from "@/hooks/nauta/useNautaRuns";
import { useNautaTemplates } from "@/hooks/nauta/useNautaTemplates";
import { useNautaHealth } from "@/hooks/nauta/useNautaHealth";
import { NautaKpiRow } from "@/lib/nauta/components/NautaKpiRow";
import { NautaEmployeeGrid } from "@/lib/nauta/components/NautaEmployeeGrid";
import { NautaRunsTable } from "@/lib/nauta/components/NautaRunsTable";
import { NautaExecutePanel } from "@/lib/nauta/components/NautaExecutePanel";

const PAGE_SIZE = 10;

export function NautaCockpitView() {
  const { tenant } = useAuth();
  const { data: branding } = useTenantBranding();
  const { tenantSlug } = useTenant();
  const [page, setPage] = useState(1);

  const healthQuery = useNautaHealth();
  const employeesQuery = useNautaEmployees();
  const templatesQuery = useNautaTemplates();
  const runsQuery = useNautaRuns(page, PAGE_SIZE);

  const institutionName = resolveVisiblePlatformTitle(branding, tenant);
  const employees = employeesQuery.data ?? [];
  const runs = runsQuery.data?.items ?? [];
  const total = runsQuery.data?.total ?? 0;
  const loading = employeesQuery.isLoading || runsQuery.isLoading;

  const healthOk = healthQuery.data?.status === "ok";

  return (
    <div id="main-content" data-testid="nauta-cockpit" className="min-w-0 space-y-8 pb-10">
      <header className="relative overflow-hidden rounded-2xl border border-zinc-800/50 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 p-6 md:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Nauta · Empleados digitales</p>
            <h1 className="mt-1 text-2xl font-medium tracking-tight text-zinc-100 md:text-3xl">{institutionName}</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Cockpit operativo — tenant{" "}
              <span className="font-mono text-zinc-300">{tenantSlug ?? tenant?.slug ?? "—"}</span>
            </p>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-[11px] font-medium ${
              healthOk
                ? "border-emerald-800/50 bg-emerald-950/30 text-emerald-400"
                : healthQuery.isLoading
                  ? "border-zinc-700 text-zinc-500"
                  : "border-amber-800/50 bg-amber-950/30 text-amber-400"
            }`}
          >
            API {healthOk ? "ok" : healthQuery.isLoading ? "…" : "degradada"}
          </span>
        </div>
      </header>

      <section aria-labelledby="nauta-kpis">
        <h2 id="nauta-kpis" className="sr-only">
          Indicadores
        </h2>
        <NautaKpiRow employees={employees} runs={runs} loading={loading} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-zinc-100">Ejecutar plantilla</h2>
        <NautaExecutePanel
          templates={templatesQuery.data ?? []}
          loading={templatesQuery.isLoading}
          error={!!templatesQuery.error}
          onRetry={() => void templatesQuery.refetch()}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-zinc-100">Empleados digitales</h2>
        <NautaEmployeeGrid
          employees={employees}
          loading={employeesQuery.isLoading}
          error={!!employeesQuery.error}
          onRetry={() => void employeesQuery.refetch()}
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-medium text-zinc-100">Ejecuciones recientes</h2>
          {total > 0 ? <span className="text-xs text-zinc-500">{total} total</span> : null}
        </div>
        <NautaRunsTable
          runs={runs}
          loading={runsQuery.isLoading}
          error={!!runsQuery.error}
          onRetry={() => void runsQuery.refetch()}
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
        />
      </section>
    </div>
  );
}

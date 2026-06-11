"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { ForgePageHeader } from "@/components/credit-hub/system/ForgePageHeader";
import { EmptyState } from "@/components/forge/ui/EmptyState";
import { useMarketIntelTenant } from "../hooks/useMarketIntelTenant";
import { createRun, getRun, getSnapshot, listRuns, startRun } from "../lib/api";
import type { CreateRunBody, RunResponse, SnapshotPayload } from "../lib/types";
import { RunSelector } from "./RunSelector";
import { RunWorkspace } from "./RunWorkspace";

export function MarketIntelClient() {
  const { effectiveTenantId, tenantHydrated, tenantError } = useMarketIntelTenant();
  const [runs, setRuns] = useState<RunResponse[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [activeRun, setActiveRun] = useState<RunResponse | null>(null);
  const [snapshot, setSnapshot] = useState<SnapshotPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshRuns = useCallback(async () => {
    if (!effectiveTenantId) return;
    const data = await listRuns(effectiveTenantId);
    setRuns(data);
    if (!selectedRunId && data.length > 0) {
      setSelectedRunId(data[0].id);
    }
  }, [effectiveTenantId, selectedRunId]);

  const refreshActiveRun = useCallback(async () => {
    if (!effectiveTenantId || !selectedRunId) {
      setActiveRun(null);
      setSnapshot(null);
      return;
    }
    const run = await getRun(effectiveTenantId, selectedRunId);
    setActiveRun(run);

    if (run.status === "draft") {
      setSnapshot(null);
      return;
    }

    const snap = await getSnapshot(effectiveTenantId, selectedRunId);
    setSnapshot(snap);
  }, [effectiveTenantId, selectedRunId]);

  useEffect(() => {
    if (!tenantHydrated || !effectiveTenantId) return;
    setLoading(true);
    setError(null);
    void refreshRuns()
      .catch(() => setError("No se pudieron cargar las investigaciones."))
      .finally(() => setLoading(false));
  }, [tenantHydrated, effectiveTenantId, refreshRuns]);

  useEffect(() => {
    if (!effectiveTenantId || !selectedRunId) return;
    void refreshActiveRun().catch(() => setError("No se pudo cargar la investigación seleccionada."));
  }, [effectiveTenantId, selectedRunId, refreshActiveRun]);

  const handleCreate = async (body: CreateRunBody) => {
    if (!effectiveTenantId) return;
    setCreating(true);
    setError(null);
    try {
      const created = await createRun(effectiveTenantId, body);
      await refreshRuns();
      setSelectedRunId(created.id);
    } catch {
      setError("No se pudo crear la investigación.");
    } finally {
      setCreating(false);
    }
  };

  const handleStart = async () => {
    if (!effectiveTenantId || !selectedRunId) return;
    setStarting(true);
    setError(null);
    try {
      const updated = await startRun(effectiveTenantId, selectedRunId);
      setActiveRun(updated);
      await refreshRuns();
      const snap = await getSnapshot(effectiveTenantId, selectedRunId);
      setSnapshot(snap);
    } catch {
      setError("No se pudo iniciar la investigación.");
    } finally {
      setStarting(false);
    }
  };

  if (!tenantHydrated) {
    return <p className="text-forge-sm text-forgeGray-500">Cargando…</p>;
  }

  if (!effectiveTenantId || tenantError) {
    return (
      <p className="text-forge-sm text-forgeDanger-700" role="alert">
        {tenantError ?? "Tenant no disponible"}
      </p>
    );
  }

  return (
    <main id="main-content" className="market-intel-mee min-h-0 space-y-6">
      <ForgePageHeader
        title="Inteligencia de Mercado"
        subtitle="Market Entry Engine — investigación y estrategia de entrada"
        action={
          <button
            type="button"
            onClick={() => {
              void refreshRuns();
              void refreshActiveRun();
            }}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-forge-sm border border-forgeGray-200 bg-white px-3 py-2 text-forge-sm font-medium text-forgeGray-700 shadow-forge-xs hover:bg-forgeGray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--mee-accent)]"
            aria-label="Actualizar datos"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            Actualizar
          </button>
        }
      />

      {error ? (
        <p className="text-forge-sm text-forgeDanger-700" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <RunSelector
          runs={runs}
          selectedRunId={selectedRunId}
          onSelect={setSelectedRunId}
          onCreate={handleCreate}
          creating={creating}
        />

        {loading ? (
          <p className="text-forge-sm text-forgeGray-500">Cargando investigaciones…</p>
        ) : !activeRun ? (
          <EmptyState
            title="Seleccione una investigación"
            description="Elija un run existente o cree uno nuevo para comenzar."
            className="min-w-0 flex-1"
          />
        ) : (
          <RunWorkspace
            run={activeRun}
            snapshot={snapshot}
            starting={starting}
            onStart={() => void handleStart()}
          />
        )}
      </div>
    </main>
  );
}

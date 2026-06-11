"use client";

import { useCallback, useEffect, useState } from "react";
import { Play, RefreshCw } from "lucide-react";
import { ForgePageHeader } from "@/components/credit-hub/system/ForgePageHeader";
import { EmptyState } from "@/components/forge/ui/EmptyState";
import { useMarketIntelTenant } from "../hooks/useMarketIntelTenant";
import {
  createRun,
  getRun,
  getSnapshot,
  listRuns,
  startRun,
  uploadDocument,
  validateRun,
} from "../lib/api";
import type { CreateRunBody, RunResponse, SnapshotPayload } from "../lib/types";
import { RunSelector } from "./RunSelector";
import { RunStatusBadge } from "./RunStatusBadge";
import { IntelligenceView } from "./IntelligenceView";
import { DocumentUploadPanel } from "./DocumentUploadPanel";
import { ValidatePanel } from "./ValidatePanel";

export function MarketIntelClient() {
  const { effectiveTenantId, tenantHydrated, tenantError } = useMarketIntelTenant();
  const [runs, setRuns] = useState<RunResponse[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [activeRun, setActiveRun] = useState<RunResponse | null>(null);
  const [snapshot, setSnapshot] = useState<SnapshotPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [starting, setStarting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [counselRequired, setCounselRequired] = useState(false);
  const [alreadyValidated, setAlreadyValidated] = useState(false);
  const [lastUploaded, setLastUploaded] = useState<string | null>(null);
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
    if (run.status === "needs_validation" || run.status === "validated") {
      const snap = await getSnapshot(effectiveTenantId, selectedRunId);
      setSnapshot(snap);
    } else {
      setSnapshot(null);
    }
    setAlreadyValidated(run.status === "validated");
    setCounselRequired(false);
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

  const handleUpload = async (file: File) => {
    if (!effectiveTenantId || !selectedRunId) return;
    setUploading(true);
    try {
      const res = await uploadDocument(effectiveTenantId, selectedRunId, file);
      setLastUploaded(res.filename);
      await refreshActiveRun();
    } finally {
      setUploading(false);
    }
  };

  const handleValidate = async (counselSigned: boolean) => {
    if (!effectiveTenantId || !selectedRunId) return;
    setValidating(true);
    setError(null);
    try {
      const result = await validateRun(effectiveTenantId, selectedRunId, {
        counsel_signed: counselSigned,
      });
      setActiveRun(result.run);
      setCounselRequired(Boolean(result.counselRequired));
      setAlreadyValidated(Boolean(result.alreadyValidated));
      await refreshRuns();
      if (result.run.status === "validated") {
        const snap = await getSnapshot(effectiveTenantId, selectedRunId);
        setSnapshot(snap);
      }
    } catch {
      setError("No se pudo validar la investigación.");
    } finally {
      setValidating(false);
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
        subtitle="Market Entry Engine — investigación, validación y estrategia de entrada"
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

        <div className="min-w-0 flex-1 space-y-6">
          {loading ? (
            <p className="text-forge-sm text-forgeGray-500">Cargando investigaciones…</p>
          ) : !activeRun ? (
            <EmptyState
              title="Seleccione una investigación"
              description="Elija un run existente o cree uno nuevo para comenzar."
            />
          ) : (
            <>
              <header className="flex flex-col gap-3 rounded-forge-lg border border-forgeGray-200 bg-forgeSurface-card p-4 shadow-forge-xs sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-display text-forge-xl font-semibold text-forgeGray-800">
                    {activeRun.product.replace(/_/g, " ")}
                  </h2>
                  <p className="mt-1 text-forge-sm text-forgeGray-500">
                    {activeRun.country_iso} · {activeRun.vertical.replace(/_/g, " ")} ·{" "}
                    {activeRun.currency}
                  </p>
                </div>
                <RunStatusBadge status={activeRun.status} />
              </header>

              {activeRun.status === "draft" || activeRun.status === "researching" ? (
                <EmptyState
                  title={
                    activeRun.status === "researching"
                      ? "Investigación en curso"
                      : "Sin snapshot aún"
                  }
                  description={
                    activeRun.status === "researching"
                      ? "El motor está recopilando fuentes. Vuelva a actualizar en unos momentos."
                      : "Inicie la investigación para generar el snapshot de inteligencia."
                  }
                  action={
                    activeRun.status === "draft" ? (
                      <button
                        type="button"
                        disabled={starting}
                        onClick={() => void handleStart()}
                        className="inline-flex min-h-[40px] items-center gap-2 rounded-forge-sm bg-[var(--mee-accent)] px-4 py-2 text-forge-sm font-semibold text-white disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--mee-accent)]"
                      >
                        <Play className="h-4 w-4" aria-hidden />
                        {starting ? "Iniciando…" : "Iniciar investigación"}
                      </button>
                    ) : undefined
                  }
                />
              ) : null}

              {snapshot ? <IntelligenceView snapshot={snapshot} /> : null}

              {activeRun.status === "needs_validation" || activeRun.status === "validated" ? (
                <>
                  <DocumentUploadPanel
                    onUpload={handleUpload}
                    uploading={uploading}
                    lastUploaded={lastUploaded}
                  />
                  <ValidatePanel
                    run={activeRun}
                    findings={snapshot?.findings ?? []}
                    onValidate={handleValidate}
                    validating={validating}
                    counselRequired={counselRequired}
                    alreadyValidated={alreadyValidated}
                  />
                </>
              ) : null}
            </>
          )}
        </div>
      </div>
    </main>
  );
}

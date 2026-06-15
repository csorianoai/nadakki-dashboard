"use client";

import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/forge/ui/EmptyState";
import { useMarketIntelTenant } from "../hooks/useMarketIntelTenant";
import {
  createRun,
  getRun,
  getSnapshot,
  listPacks,
  listRuns,
  startRun,
  validateRun,
} from "../lib/api";
import type { CreateRunBody, MarketIntelPack, RunResponse, SnapshotPayload } from "../lib/types";
import { IntelligenceView } from "./IntelligenceView";

const DEFAULT_CREATE_BODY: CreateRunBody = {
  country_iso: "DO",
  vertical: "consumer_credit",
  product: "auto_loan",
  institution_types: ["commercial_bank", "cooperative"],
};

export function MarketIntelClient() {
  const { effectiveTenantId, tenantHydrated, tenantError } = useMarketIntelTenant();
  const [runs, setRuns] = useState<RunResponse[]>([]);
  const [packs, setPacks] = useState<MarketIntelPack[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [activeRun, setActiveRun] = useState<RunResponse | null>(null);
  const [snapshot, setSnapshot] = useState<SnapshotPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSnapshot, setLoadingSnapshot] = useState(false);
  const [creating, setCreating] = useState(false);
  const [starting, setStarting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [counselRequired, setCounselRequired] = useState(false);
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
    setLoadingSnapshot(true);
    try {
      const run = await getRun(effectiveTenantId, selectedRunId);
      setActiveRun(run);
      setCounselRequired(false);

      if (run.status === "draft") {
        setSnapshot(null);
        return;
      }

      const snap = await getSnapshot(effectiveTenantId, selectedRunId);
      setSnapshot(snap);
    } finally {
      setLoadingSnapshot(false);
    }
  }, [effectiveTenantId, selectedRunId]);

  useEffect(() => {
    if (!tenantHydrated || !effectiveTenantId) return;
    setLoading(true);
    setError(null);
    void Promise.all([
      refreshRuns(),
      listPacks(effectiveTenantId)
        .then(setPacks)
        .catch(() => setPacks([])),
    ])
      .catch(() => setError("No se pudieron cargar las investigaciones."))
      .finally(() => setLoading(false));
  }, [tenantHydrated, effectiveTenantId, refreshRuns]);

  useEffect(() => {
    if (!effectiveTenantId || !selectedRunId) return;
    void refreshActiveRun().catch(() =>
      setError("No se pudo cargar la investigación seleccionada.")
    );
  }, [effectiveTenantId, selectedRunId, refreshActiveRun]);

  const handleCreate = async () => {
    if (!effectiveTenantId) return;
    setCreating(true);
    setError(null);
    try {
      const body: CreateRunBody = packs.length
        ? {
            country_iso: packs[0].country_iso,
            vertical: DEFAULT_CREATE_BODY.vertical,
            product: DEFAULT_CREATE_BODY.product,
            institution_types: DEFAULT_CREATE_BODY.institution_types,
          }
        : DEFAULT_CREATE_BODY;
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
      setLoadingSnapshot(true);
      const snap = await getSnapshot(effectiveTenantId, selectedRunId);
      setSnapshot(snap);
    } catch {
      setError("No se pudo iniciar la investigación.");
    } finally {
      setStarting(false);
      setLoadingSnapshot(false);
    }
  };

  const handleValidate = async () => {
    if (!effectiveTenantId || !selectedRunId) return;
    setValidating(true);
    setError(null);
    try {
      const result = await validateRun(effectiveTenantId, selectedRunId, {
        counsel_signed: counselRequired,
      });

      if (result.counselRequired) {
        setCounselRequired(true);
        return;
      }

      setCounselRequired(false);
      setActiveRun(result.run);
      await refreshRuns();

      if (result.run.status === "validated" || result.alreadyValidated) {
        setLoadingSnapshot(true);
        const snap = await getSnapshot(effectiveTenantId, selectedRunId);
        setSnapshot(snap);
        setLoadingSnapshot(false);
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
    <div
      id="main-content"
      className="market-intel-mee"
      style={{ minHeight: "calc(100vh - 64px)", display: "flex", flexDirection: "column" }}
    >
      {error ? (
        <p
          className="text-forge-sm text-forgeDanger-700"
          role="alert"
          style={{ padding: "12px 16px" }}
        >
          {error}
        </p>
      ) : null}

      {loading ? (
        <p style={{ padding: 24, fontSize: 13, color: "var(--mee-ink-3)" }}>
          Cargando investigaciones…
        </p>
      ) : !activeRun ? (
        <EmptyState
          title="Seleccione una investigación"
          description="Elija un run existente o cree uno nuevo para comenzar."
          className="flex-1"
        />
      ) : (
        <IntelligenceView
          run={activeRun}
          snapshot={snapshot}
          runs={runs}
          selectedRunId={selectedRunId}
          onSelectRun={setSelectedRunId}
          onCreateRun={() => void handleCreate()}
          creating={creating}
          onStart={() => void handleStart()}
          starting={starting}
          onValidate={() => void handleValidate()}
          validating={validating}
          loadingSnapshot={loadingSnapshot}
        />
      )}
    </div>
  );
}

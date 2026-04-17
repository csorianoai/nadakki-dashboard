"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Activity, ExternalLink, Loader2, Play, RefreshCw } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import { useTenant } from "@/contexts/TenantContext";
import {
  fetchMarketingJourneyRuns,
  fetchMarketingJourneys,
  runMarketingJourney,
} from "@/lib/api/marketing";

function summarizeRun(data: Record<string, unknown> | null): string {
  if (!data || Object.keys(data).length === 0) return "Sin cuerpo en la respuesta.";
  const status = data.status ?? data.state ?? data.result;
  const message = data.message ?? data.detail;
  const id = data.run_id ?? data.id ?? data.execution_id;
  const parts: string[] = [];
  if (status != null) parts.push(`Estado: ${String(status)}`);
  if (message != null) parts.push(String(message));
  if (id != null) parts.push(`ID: ${String(id)}`);
  return parts.length ? parts.join(" · ") : JSON.stringify(data).slice(0, 400);
}

export default function MarketingRunPage() {
  const { tenantId } = useTenant();
  const [health, setHealth] = useState<{ ok: boolean; detail: string } | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);

  const [journeys, setJourneys] = useState<{ id: string; name: string }[]>([]);
  const [journeysError, setJourneysError] = useState<string | null>(null);
  const [loadingJourneys, setLoadingJourneys] = useState(false);

  const [journeyId, setJourneyId] = useState("");
  const [runLoading, setRunLoading] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<Record<string, unknown> | null>(null);

  const [runsLoading, setRunsLoading] = useState(false);
  const [runsError, setRunsError] = useState<string | null>(null);
  const [runs, setRuns] = useState<
    { id: string; timestamp: string; status: string; message: string }[]
  >([]);

  const refreshHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const res = await fetch("/health", { cache: "no-store" });
      const text = await res.text().catch(() => "");
      setHealth({ ok: res.ok, detail: res.ok ? "OK" : `${res.status} ${text.slice(0, 120)}` });
    } catch (e) {
      setHealth({ ok: false, detail: (e as Error).message });
    } finally {
      setHealthLoading(false);
    }
  }, []);

  const loadJourneys = useCallback(async () => {
    if (!tenantId?.trim()) {
      setJourneys([]);
      setJourneysError(null);
      return;
    }
    setLoadingJourneys(true);
    setJourneysError(null);
    try {
      const { journeys: raw, error } = await fetchMarketingJourneys(tenantId.trim());
      if (error) {
        setJourneys([]);
        setJourneysError(error);
        return;
      }
      const mapped = raw.map((j) => ({
        id: String(j.id ?? ""),
        name: String(j.name ?? j.title ?? j.id ?? ""),
      })).filter((x) => x.id.length > 0);
      setJourneys(mapped);
    } finally {
      setLoadingJourneys(false);
    }
  }, [tenantId]);

  useEffect(() => {
    void refreshHealth();
  }, [refreshHealth]);

  useEffect(() => {
    void loadJourneys();
  }, [loadJourneys]);

  const loadRuns = async () => {
    if (!tenantId?.trim() || !journeyId.trim()) {
      setRunsError("Selecciona tenant e ID de journey.");
      return;
    }
    setRunsLoading(true);
    setRunsError(null);
    const { runs: r, error } = await fetchMarketingJourneyRuns(tenantId.trim(), journeyId.trim());
    setRunsLoading(false);
    if (error) {
      setRuns([]);
      setRunsError(error);
      return;
    }
    setRuns(
      r.map((x) => ({
        id: x.id,
        timestamp: x.timestamp,
        status: x.status,
        message: x.message,
      }))
    );
  };

  const handleRun = async () => {
    if (!tenantId?.trim()) {
      setRunError("Selecciona un tenant.");
      return;
    }
    if (!journeyId.trim()) {
      setRunError("Indica el ID del journey.");
      return;
    }
    setRunLoading(true);
    setRunError(null);
    setRunResult(null);
    const out = await runMarketingJourney(tenantId.trim(), journeyId.trim());
    setRunLoading(false);
    if (!out.ok) {
      setRunError(out.error ?? "Error al ejecutar");
      return;
    }
    setRunResult(out.data);
    void loadRuns();
  };

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/marketing" />

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white m-0">Marketing Run</h1>
        <p className="text-gray-400 mt-1 m-0">
          Ejecución manual de journeys y visibilidad mínima del stack (mismo contrato que{" "}
          <code className="text-violet-300/90">POST /api/marketing/journeys/{"{id}"}/run</code>).
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-3 text-sm">
        <Link
          href="/orchestration"
          className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-gray-300 hover:bg-white/10 hover:text-white"
        >
          Orquestación <ExternalLink className="w-3.5 h-3.5 opacity-70" />
        </Link>
        <Link
          href="/ame"
          className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-gray-300 hover:bg-white/10 hover:text-white"
        >
          AME / Autopilot <ExternalLink className="w-3.5 h-3.5 opacity-70" />
        </Link>
        <Link
          href="/onboarding/observability"
          className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-gray-300 hover:bg-white/10 hover:text-white"
        >
          Runs / observabilidad <ExternalLink className="w-3.5 h-3.5 opacity-70" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white m-0">Backend / health</h2>
            <button
              type="button"
              onClick={() => void refreshHealth()}
              disabled={healthLoading}
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-gray-300 hover:bg-white/10 disabled:opacity-50"
            >
              {healthLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Actualizar
            </button>
          </div>
          {health ? (
            <p className={`text-sm m-0 ${health.ok ? "text-emerald-300" : "text-amber-300"}`}>
              {health.ok ? "Conectado" : "Problema"}: {health.detail}
            </p>
          ) : (
            <p className="text-sm text-gray-500 m-0">Sin lectura aún.</p>
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold text-white mb-2 m-0">Journeys disponibles</h2>
          <p className="text-xs text-gray-500 m-0 mb-3">
            Lista desde <code className="text-gray-400">GET /api/marketing/journeys</code>. Puedes pegar un ID manualmente.
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              type="button"
              onClick={() => void loadJourneys()}
              disabled={loadingJourneys || !tenantId?.trim()}
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-gray-300 hover:bg-white/10 disabled:opacity-50"
            >
              {loadingJourneys ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Refrescar lista
            </button>
          </div>
          {journeysError && <p className="text-sm text-amber-300/90 m-0 mb-2">{journeysError}</p>}
          {!tenantId?.trim() ? (
            <p className="text-sm text-gray-500 m-0">Selecciona un tenant.</p>
          ) : (
            <label className="block text-xs text-gray-500">
              Journey
              <select
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                value={journeys.some((j) => j.id === journeyId) ? journeyId : ""}
                onChange={(e) => setJourneyId(e.target.value)}
              >
                <option value="" className="bg-[#0d1117]">
                  — Elegir —
                </option>
                {journeys.map((j) => (
                  <option key={j.id} value={j.id} className="bg-[#0d1117]">
                    {j.name || j.id}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="block text-xs text-gray-500 mt-3">
            ID del journey (manual)
            <input
              type="text"
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white font-mono"
              value={journeyId}
              onChange={(e) => setJourneyId(e.target.value)}
              placeholder="uuid o slug del journey"
            />
          </label>
        </GlassCard>

        <GlassCard className="p-6 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-white m-0 inline-flex items-center gap-2">
              <Play className="w-5 h-5 text-violet-400" /> Ejecutar journey
            </h2>
            <button
              type="button"
              onClick={() => void handleRun()}
              disabled={runLoading || !tenantId?.trim() || !journeyId.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {runLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
              POST /run
            </button>
          </div>
          {runError && <p className="text-sm text-red-400 m-0 mb-2">{runError}</p>}
          {runResult && (
            <div className="space-y-2 rounded-lg border border-white/10 bg-black/25 p-4">
              <p className="text-xs text-gray-500 m-0">Resumen</p>
              <p className="text-sm text-gray-200 m-0">{summarizeRun(runResult)}</p>
              <details className="text-xs">
                <summary className="cursor-pointer text-gray-500">JSON completo</summary>
                <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words text-gray-400 m-0">
                  {JSON.stringify(runResult, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-6 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-white m-0">Historial reciente</h2>
            <button
              type="button"
              onClick={() => void loadRuns()}
              disabled={runsLoading || !journeyId.trim()}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-200 hover:bg-white/10 disabled:opacity-50"
            >
              {runsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              GET /runs
            </button>
          </div>
          <p className="text-xs text-gray-500 m-0 mb-3">
            Hasta 5 ejecuciones recientes por journey (contrato <code className="text-gray-400">GET .../journeys/{"{id}"}/runs</code>).
          </p>
          {runsError && <p className="text-sm text-amber-300/90 m-0 mb-2">{runsError}</p>}
          {runs.length === 0 && !runsLoading && !runsError ? (
            <p className="text-sm text-gray-500 m-0">Aún no hay historial cargado.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-white/10">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="px-3 py-2 font-medium text-gray-400">Estado</th>
                    <th className="px-3 py-2 font-medium text-gray-400">Tiempo</th>
                    <th className="px-3 py-2 font-medium text-gray-400">Mensaje</th>
                    <th className="px-3 py-2 font-medium text-gray-400">Run ID</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((row) => (
                    <tr key={row.id || row.timestamp} className="border-b border-white/5">
                      <td className="px-3 py-2 text-gray-200">{row.status || "—"}</td>
                      <td className="px-3 py-2 text-gray-400 font-mono text-xs">{row.timestamp || "—"}</td>
                      <td className="px-3 py-2 text-gray-300 max-w-md truncate">{row.message || "—"}</td>
                      <td className="px-3 py-2 text-gray-500 font-mono text-xs">{row.id || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

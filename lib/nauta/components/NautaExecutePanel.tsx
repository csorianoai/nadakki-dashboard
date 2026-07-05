"use client";

import { useState } from "react";
import { Play, Loader2 } from "lucide-react";
import type { NautaTemplate } from "@/lib/nauta/types";
import { useNautaCreateRun } from "@/hooks/nauta/useNautaCreateRun";
import { NautaEmptyState } from "./NautaEmptyState";

export function NautaExecutePanel({
  templates,
  loading,
  error,
  onRetry,
}: {
  templates: NautaTemplate[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}) {
  const [selectedId, setSelectedId] = useState("");
  const createMutation = useNautaCreateRun();
  const [lastRunId, setLastRunId] = useState<string | null>(null);

  if (loading) {
    return <div className="h-24 rounded-xl border border-zinc-800 bg-zinc-900 animate-pulse" />;
  }

  if (error) {
    return (
      <NautaEmptyState
        variant="error"
        title="No se pudieron cargar plantillas"
        onRetry={onRetry}
      />
    );
  }

  if (templates.length === 0) {
    return (
      <NautaEmptyState
        title="Sin plantillas disponibles"
        description="El backend Nauta aún no publicó templates para tu institución."
      />
    );
  }

  const effectiveId = selectedId || templates[0]?.id || "";

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
      <h3 className="text-sm font-medium text-zinc-100 mb-3">Nueva ejecución</h3>
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={effectiveId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 focus:border-violet-500/50 focus:outline-none"
        >
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.role_id} · {t.risk_level})
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={!effectiveId || createMutation.isPending}
          onClick={() => {
            void createMutation
              .mutateAsync({
                template_id: effectiveId,
                dry_run: true,
                mode: "simulate",
              })
              .then((run) => setLastRunId(run.id));
          }}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {createMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Play className="h-4 w-4" aria-hidden />
          )}
          Ejecutar (simulate)
        </button>
      </div>
      <p className="mt-2 text-xs text-zinc-500">Modo dry-run/simulate por defecto — POST /api/v1/nauta/runs</p>
      {createMutation.isError ? (
        <p className="mt-2 text-xs text-red-400" role="alert">
          {createMutation.error instanceof Error ? createMutation.error.message : "Error al ejecutar"}
        </p>
      ) : null}
      {lastRunId ? (
        <p className="mt-2 text-xs text-emerald-400">
          Run creado:{" "}
          <a href={`/nauta/runs/${lastRunId}`} className="underline font-mono">
            {lastRunId}
          </a>
        </p>
      ) : null}
    </div>
  );
}

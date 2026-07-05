"use client";

import { useEffect, useMemo, useState } from "react";
import { Play, Loader2 } from "lucide-react";
import { resolveTemplateTaskName, type NautaTemplate } from "@/lib/nauta/types";
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
  const [selectedTaskName, setSelectedTaskName] = useState("");
  const createMutation = useNautaCreateRun();
  const [lastRunId, setLastRunId] = useState<string | null>(null);

  const taskNames = useMemo(
    () => templates.map((t) => resolveTemplateTaskName(t)).filter(Boolean),
    [templates],
  );

  useEffect(() => {
    if (taskNames.length === 0) return;
    setSelectedTaskName((prev) => (prev && taskNames.includes(prev) ? prev : taskNames[0]!));
  }, [taskNames]);

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

  const canExecute = selectedTaskName.length > 0 && !createMutation.isPending;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
      <h3 className="text-sm font-medium text-zinc-100 mb-3">Nueva ejecución</h3>
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={selectedTaskName}
          onChange={(e) => setSelectedTaskName(e.target.value)}
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 focus:border-violet-500/50 focus:outline-none"
        >
          {templates.map((t) => {
            const taskName = resolveTemplateTaskName(t);
            return (
              <option key={`${t.id}-${taskName}`} value={taskName}>
                {t.name !== taskName ? `${t.name} (${taskName})` : taskName}
                {t.role_id ? ` · ${t.role_id}` : ""}
                {t.risk_level ? ` · ${t.risk_level}` : ""}
              </option>
            );
          })}
        </select>
        <button
          type="button"
          disabled={!canExecute}
          onClick={() => {
            if (!selectedTaskName) return;
            void createMutation
              .mutateAsync({
                task_name: selectedTaskName,
                mode: "simulate",
              })
              .then((run) => setLastRunId(run.id))
              .catch(() => {
                /* error surfaced via createMutation.isError */
              });
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
      <p className="mt-2 text-xs text-zinc-500">
        POST /api/v1/nauta/runs — body: {"{ task_name, mode: \"simulate\" }"}
      </p>
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

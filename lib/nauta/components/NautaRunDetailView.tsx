"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronLeft, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNautaRun } from "@/hooks/nauta/useNautaRun";
import { useNautaEvidence } from "@/hooks/nauta/useNautaEvidence";
import { useNautaApprove } from "@/hooks/nauta/useNautaApprove";
import { NautaEmptyState } from "@/lib/nauta/components/NautaEmptyState";
import { NautaLiveView } from "@/lib/nauta/components/NautaLiveView";
import { isNautaSupervisor, runRequiresApproval } from "@/lib/nauta/permissions";

export function NautaRunDetailView({ runId }: { runId: string }) {
  const router = useRouter();
  const { activeRole, allRoles } = useAuth();
  const runQuery = useNautaRun(runId);
  const evidenceQuery = useNautaEvidence(runId);
  const approveMutation = useNautaApprove(runId);

  const supervisor = isNautaSupervisor(activeRole, allRoles);
  const run = runQuery.data;
  const evidence = evidenceQuery.data ?? run?.evidence ?? [];

  if (runQuery.isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 rounded bg-zinc-800" />
        <div className="h-40 rounded-xl bg-zinc-900 border border-zinc-800" />
        <div className="h-64 rounded-xl bg-zinc-900 border border-zinc-800" />
      </div>
    );
  }

  if (runQuery.error || !run) {
    return (
      <NautaEmptyState
        variant="error"
        title="Run no encontrado"
        description="No pudimos cargar el detalle desde GET /api/v1/nauta/runs/{id}."
        onRetry={() => void runQuery.refetch()}
      />
    );
  }

  const canApprove = supervisor && runRequiresApproval(run.status);

  return (
    <div id="main-content" data-testid="nauta-run-detail" className="min-w-0 space-y-6 pb-10">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/nauta"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Cockpit
        </Link>
        <span className="text-zinc-700">/</span>
        <span className="font-mono text-sm text-zinc-400">{run.id}</span>
      </div>

      <header className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
        <h1 className="text-xl font-medium text-zinc-100">{run.task_name}</h1>
        <p className="mt-1 text-sm text-zinc-400">{run.role_name}</p>
        <div className="mt-4 flex flex-wrap gap-3 text-xs">
          <span className="rounded-md border border-zinc-700 px-2 py-1 text-zinc-300">Estado: {run.status}</span>
          <span className="rounded-md border border-zinc-700 px-2 py-1 text-zinc-300">Riesgo: {run.risk_level}</span>
          <span className="rounded-md border border-zinc-700 px-2 py-1 text-zinc-300">
            {run.hours_saved_estimate.toFixed(1)}h ahorradas
          </span>
          <span className="rounded-md border border-zinc-700 px-2 py-1 text-zinc-300">
            {run.findings_count} hallazgos · {run.evidence_count} evidencias
          </span>
        </div>
        {canApprove ? (
          <button
            type="button"
            disabled={approveMutation.isPending}
            onClick={() => {
              void approveMutation.mutateAsync().then(() => router.refresh());
            }}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:brightness-110 disabled:opacity-60"
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            {approveMutation.isPending ? "Aprobando…" : "Aprobar ejecución"}
          </button>
        ) : runRequiresApproval(run.status) && !supervisor ? (
          <p className="mt-4 flex items-center gap-2 text-xs text-amber-400/90">
            <Shield className="h-3.5 w-3.5" aria-hidden />
            Requiere supervisor Nauta para aprobar
          </p>
        ) : null}
      </header>

      <NautaLiveView
        taskName={run.task_name}
        initialRunId={run.status === "running" ? run.id : undefined}
        variant="panel"
      />

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
        <div className="border-b border-zinc-800 px-4 py-3">
          <h2 className="text-sm font-medium text-zinc-100">Pasos</h2>
        </div>
        {run.steps.length === 0 ? (
          <p className="px-4 py-6 text-sm text-zinc-500">Sin pasos registrados.</p>
        ) : (
          <ol className="divide-y divide-zinc-800/80">
            {run.steps.map((step, i) => (
              <li key={step.id} className="flex gap-3 px-4 py-3 text-sm">
                <span className="font-mono text-xs text-zinc-600 w-6">{i + 1}</span>
                <div>
                  <p className="text-zinc-200">{step.label}</p>
                  <p className="text-xs text-zinc-500">{step.status}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
        <div className="border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-100">Evidencia — cadena de custodia</h2>
          <span className="text-[10px] uppercase tracking-wider text-violet-400">SHA-256</span>
        </div>
        {evidenceQuery.isLoading ? (
          <div className="px-4 py-8 animate-pulse h-24 bg-zinc-950/50" />
        ) : evidenceQuery.isError ? (
          <NautaEmptyState
            variant="error"
            title="Error cargando evidencia"
            onRetry={() => void evidenceQuery.refetch()}
          />
        ) : evidence.length === 0 ? (
          <p className="px-4 py-6 text-sm text-zinc-500">Sin artefactos en GET /runs/{runId}/evidence.</p>
        ) : (
          <ul className="divide-y divide-zinc-800/80">
            {evidence.map((ev, idx) => (
              <li key={`${ev.artifact_hash_sha256}-${idx}`} className="px-4 py-4 space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded border border-zinc-700 px-2 py-0.5 text-zinc-400">{ev.artifact_type}</span>
                  <span className="text-zinc-600">{ev.captured_at}</span>
                </div>
                <p className="font-mono text-[11px] text-emerald-400/90 break-all">{ev.artifact_hash_sha256}</p>
                {ev.source_url ? (
                  <a
                    href={ev.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-violet-400 hover:underline break-all"
                  >
                    {ev.source_url}
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-3 text-sm text-zinc-400">
        Costo: <span className="text-zinc-200 tabular-nums">{run.cost.tokens.toLocaleString()}</span> tokens ·{" "}
        <span className="text-zinc-200 tabular-nums">${run.cost.cost_usd.toFixed(2)}</span> USD
      </section>
    </div>
  );
}

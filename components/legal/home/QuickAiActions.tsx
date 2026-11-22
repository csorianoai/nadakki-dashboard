"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useExecuteLegalTask } from "@/hooks/useExecuteLegalTask";
import { useTenant } from "@/contexts/TenantContext";
import { resolveTaskDescription, resolveTaskDisplayName, type LegalTask } from "@/lib/legal/task-types";
import { tenantSatisfiesTaskFeatures } from "@/lib/legal/task-tenant-features";

/** Las tareas más usadas en un despacho, en este orden; solo se muestran las que el backend ofrece al tenant. */
export const ACCIONES_PREFERIDAS = [
  "review_contract",
  "respond_to_lawsuit",
  "research_jurisprudence",
  "calculate_procedural_deadline",
  "verify_aml_kyc",
] as const;
export const MAX_ACCIONES = 5;

export function accionesRapidas(tasks: LegalTask[], habilitada: (t: LegalTask) => boolean): LegalTask[] {
  const porId = new Map(tasks.map((t) => [t.task_id, t]));
  const elegidas = ACCIONES_PREFERIDAS.map((id) => porId.get(id)).filter((t): t is LegalTask => Boolean(t) && habilitada(t!));
  // Si el catálogo del tenant no trae las preferidas, se completa con las primeras habilitadas.
  for (const t of tasks) {
    if (elegidas.length >= MAX_ACCIONES) break;
    if (!elegidas.includes(t) && habilitada(t)) elegidas.push(t);
  }
  return elegidas.slice(0, MAX_ACCIONES);
}

type Props = { tasks: LegalTask[]; loading: boolean; error: boolean; onRetry?: () => void };

/** Acciones rápidas de IA del Inicio: 4-6 atajos; el catálogo completo vive en /legal/asistente. */
export function QuickAiActions({ tasks, loading, error, onRetry }: Props) {
  const { open } = useExecuteLegalTask();
  const { isFeatureEnabled } = useTenant();
  const lista = accionesRapidas(tasks, (t) => tenantSatisfiesTaskFeatures(t, isFeatureEnabled));

  return (
    <section aria-labelledby="legal-ai-quick" className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 dark:border-zinc-800">
        <h2 id="legal-ai-quick" className="flex items-center gap-2 text-[15px] font-semibold text-slate-900 dark:text-zinc-100">
          <Sparkles className="h-4 w-4 text-blue-700 dark:text-blue-300" aria-hidden />Acciones rápidas de IA
        </h2>
        <Link href="/legal/asistente" className="text-xs font-semibold text-blue-700 hover:underline dark:text-blue-300">
          Ver todas{tasks.length ? ` (${tasks.length})` : ""}
        </Link>
      </div>
      <div className="p-4">
        {loading ? (
          <div className="grid gap-2 sm:grid-cols-2" aria-busy="true">{[0, 1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-100 dark:bg-zinc-800" />)}</div>
        ) : error ? (
          <p className="text-sm text-amber-800 dark:text-amber-300">
            No se pudieron cargar las tareas de IA.{" "}
            {onRetry ? <button type="button" onClick={onRetry} className="font-semibold underline">Reintentar</button> : null}
          </p>
        ) : lista.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-zinc-400">Tu plan no incluye tareas de IA disponibles.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {lista.map((t) => (
              <li key={t.task_id}>
                <button
                  type="button"
                  onClick={() => open(t)}
                  className="w-full rounded-lg border border-blue-100 bg-blue-50/50 px-3 py-2.5 text-left transition-colors hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-blue-900/60 dark:bg-blue-950/20 dark:hover:border-blue-700"
                >
                  <span className="block text-[13px] font-semibold text-blue-900 dark:text-blue-200">{resolveTaskDisplayName(t)}</span>
                  <span className="mt-0.5 block truncate text-[11px] text-slate-600 dark:text-zinc-400">{resolveTaskDescription(t)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-[11px] text-slate-500 dark:text-zinc-400">Si trabajas en un caso, lanza la tarea desde su expediente: el contexto ya va incluido. Todo resultado requiere revisión profesional.</p>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import type { LegalCase } from "@/lib/legal/cases/case-types";

type Props = { cases: LegalCase[]; loading: boolean; error: boolean };

const STATE_LABELS: Record<string, string> = {
  EVALUACION_INICIAL: "Evaluación", INGESTION: "Ingreso", TRIAGE: "Clasificación",
  STRATEGY: "Estrategia", ACTIVE: "Activo", HEARING: "Audiencia",
  JUDGMENT: "Sentencia", APPEAL: "Apelación", EXECUTION: "Ejecución",
  CLOSED: "Cerrado", ARCHIVED: "Archivado",
};
const PRIORITY_LABELS: Record<string, string> = {
  critical: "Crítica", high: "Alta", normal: "Normal", low: "Baja",
};
const priorityColor = (priority: string) =>
  priority === "critical" ? "text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-950/40"
  : priority === "high" ? "text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/40"
  : "text-slate-600 bg-slate-100 dark:text-slate-300 dark:bg-zinc-800";

function shortDate(value: string): string {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("es-DO", { day: "numeric", month: "short" });
}

/** Solo muestra expedientes ya autorizados por el servicio de casos.
 * El resumen es intencionalmente conservador: no inventa responsables ni plazos.
 */
export function ActiveCasesPanel({ cases, loading, error }: Props) {
  const active = cases
    .filter((c) => c.state !== "ARCHIVED" && c.state !== "CLOSED")
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, 5);

  return (
    <section aria-labelledby="legal-active-cases" className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-zinc-800">
        <div>
          <h2 id="legal-active-cases" className="text-base font-semibold text-slate-900 dark:text-zinc-100">Expedientes recientes</h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">Los últimos actualizados en tu despacho (no necesariamente asignados a ti). Abre uno para continuar.</p>
        </div>
        <Link href="/legal/cases" className="text-sm font-medium text-blue-700 hover:underline dark:text-blue-300">Ver expedientes</Link>
      </div>
      {loading ? <div aria-busy="true" className="space-y-3 p-5"><div className="h-8 animate-pulse rounded bg-slate-100 dark:bg-zinc-800"/><div className="h-8 animate-pulse rounded bg-slate-100 dark:bg-zinc-800"/></div>
        : error ? <p className="px-5 py-6 text-sm text-amber-700 dark:text-amber-300">No se pudieron cargar los expedientes.</p>
        : active.length === 0 ? <p className="px-5 py-6 text-sm text-slate-500 dark:text-zinc-400">No hay expedientes activos disponibles.</p>
        : <div className="overflow-x-auto"><table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-zinc-950/50 dark:text-zinc-400">
            <tr><th scope="col" className="px-5 py-3 font-medium">Expediente</th><th scope="col" className="px-3 py-3 font-medium">Fase</th><th scope="col" className="px-3 py-3 font-medium">Prioridad</th><th scope="col" className="px-3 py-3 font-medium">Actualizado</th><th scope="col" className="px-5 py-3 text-right font-medium">Acción</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
            {active.map((c) => <tr key={c.case_id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40">
              <td className="max-w-xs px-5 py-3"><span className="block truncate font-medium text-slate-900 dark:text-zinc-100">{c.title}</span><span className="block truncate text-xs text-slate-500 dark:text-zinc-400">{c.case_number_internal || "Sin número interno"}</span></td>
              <td className="whitespace-nowrap px-3 py-3 text-slate-600 dark:text-zinc-300">{STATE_LABELS[c.state] ?? c.state}</td>
              <td className="px-3 py-3"><span className={`rounded-md px-2 py-1 text-xs font-medium ${priorityColor(c.priority)}`}>{PRIORITY_LABELS[c.priority] ?? "—"}</span></td>
              <td className="whitespace-nowrap px-3 py-3 text-slate-500 dark:text-zinc-400">{shortDate(c.updated_at)}</td>
              <td className="px-5 py-3 text-right"><Link className="font-medium text-blue-700 hover:underline dark:text-blue-300" href={`/legal/cases/${encodeURIComponent(c.case_id)}`}>Abrir</Link></td>
            </tr>)}
          </tbody>
        </table></div>}
    </section>
  );
}
